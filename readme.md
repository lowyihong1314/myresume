# MyResume

`MyResume` 是一个部署在 Cloudflare 上的个人作品集与工具站点，采用前后端一体化结构：

- `frontend/` 负责 React 单页应用、展示页、工具入口、登录后后台页面
- `worker/` 负责 Cloudflare Worker API、D1 用户数据、会话 cookie、静态资源分发
- `update_deploy.sh` 负责一键构建前端并部署 Worker

项目已经从单纯作品集扩展为两层结构：

- 公开站点：首页作品集 + mini tools 入口
- 登录后台：`/dashboard`，可维护个人资料并承载更多工具入口

## Architecture

### Request Flow

1. 用户访问 `yihong1031.com`
2. Cloudflare Worker 接收请求
3. 如果是 `/api/*`，交给 Worker 内部 API 处理
4. 如果是静态页面或前端路由，交给 `env.ASSETS.fetch`
5. 若静态资源不存在，则回退到 `index.html`，由 React Router 接管

### Frontend Logic

- 首页由 `frontend/src/pages/Home.jsx` 组合多个展示组件
- 顶部导航可打开 `Tools()`
- `Tools()` 内提供：
  - QR Generator
  - Barcode Generator
  - HEIC to JPG
  - Dashboard / Login
- QR Generator 和 Barcode Generator 可匿名使用
- `Dashboard / Login` 会根据登录状态决定：
  - 已登录：进入 `/dashboard`
  - 未登录：弹出注册 / 登录
- 登录成功后前端跳转到 `/dashboard`
- Dashboard 会请求 `/api/auth/me` 读取当前用户和工具列表
- Dashboard 可更新：
  - `display_name`
  - `email`
  - `phone`
  - `password`
- 当 `username === "yukang"` 时，Dashboard 会显示 `users_management` 面板

### Backend Logic

Worker 负责以下能力：

- 健康检查：`GET /api`
- 注册：`POST /api/auth/register`
- 登录：`POST /api/auth/login`
- 当前登录用户：`GET /api/auth/me`
- 登出：`POST /api/auth/logout`
- 更新资料：`POST /api/profile`
- 管理用户列表：`GET /api/admin/users`
- 删除其他用户：`POST /api/admin/users/delete`
- 强制重置其他用户密码：`POST /api/admin/users/reset-password`
- 托管 `frontend/dist`
- SPA fallback

D1 当前用于存储用户账号与会话字段，核心字段包括：

- `username`
- `password_hash`
- `display_name`
- `email`
- `phone`
- `session_token`
- `session_expires_at`

### Session Model

- 登录成功后，Worker 生成随机 session token
- Worker 将 token 写入 D1
- 同时通过 `Set-Cookie` 返回 `HttpOnly` cookie
- 前端后续请求通过 cookie 自动带上登录态
- `/dashboard` 页面依赖该 cookie 调用 `/api/auth/me`

## Repository Map

```text
.
├─ frontend/
│  ├─ src/
│  │  ├─ components/        # 展示页组件、Header、mini_Tools
│  │  ├─ pages/
│  │  │  ├─ Home.jsx        # 公开首页
│  │  │  └─ Dashboard.jsx   # 登录后的后台页
│  │  ├─ tools/             # 浏览器工具与 auth modal
│  │  ├─ App.jsx            # React Router 路由入口
│  │  └─ main.jsx           # 前端挂载入口
│  ├─ dist/                 # 构建产物，部署时由 Worker 读取
│  └─ README.md
├─ worker/
│  ├─ src/
│  │  ├─ config.ts          # Worker 常量配置
│  │  ├─ http.ts            # JSON 响应与请求体工具
│  │  ├─ router.ts          # API 路由分发
│  │  ├─ types.ts           # Env / User 类型
│  │  ├─ handlers/
│  │  │  ├─ auth.ts         # register/login/me/logout
│  │  │  ├─ profile.ts      # profile update
│  │  │  └─ admin.ts        # users_management 管理接口
│  │  ├─ users/
│  │  │  ├─ schema.ts       # D1 schema 初始化
│  │  │  └─ session.ts      # cookie / session / current user
│  │  └─ index.ts           # Worker 入口与静态资源 fallback
│  ├─ wrangler.jsonc        # Cloudflare Worker / D1 / routes 配置
│  ├─ package.json
│  └─ README.md
├─ update_deploy.sh         # 一键 build + deploy
└─ readme.md
```

## Local Development

环境要求：

- Node.js 20+ 更稳
- npm
- Cloudflare 账号已登录 `wrangler`

### Install

```bash
cd /workspaces/myresume/frontend
npm install

cd /workspaces/myresume/worker
npm install
```

### Run Frontend

```bash
cd /workspaces/myresume/frontend
npm run dev
```

默认启动 Vite，本地地址通常是 `http://localhost:5173`

### Run Worker

```bash
cd /workspaces/myresume/worker
npm run dev
```

默认启动 Wrangler，本地地址通常是 `http://localhost:8787`

当前前端已经在 `vite.config.ts` 中把 `/api` 代理到 `127.0.0.1:8787`

## Build And Deploy

### Manual Deploy

如果你想手动分两步发布：

```bash
cd /workspaces/myresume/frontend
npx vite build

cd /workspaces/myresume/worker
npx wrangler deploy
```

说明：

- 前端必须先 build
- Worker 会读取 `../frontend/dist`
- 如果不先 build，部署出去的会是旧版静态资源

### One-Command Deploy

推荐使用：

```bash
cd /workspaces/myresume/worker
npm run deploy:full
```

这个脚本会执行：

1. `../update_deploy.sh`
2. 进入 `frontend/` 运行 `npm run build`
3. 进入 `worker/` 运行 `npm run deploy`

也就是说，`deploy:full` 是当前项目标准发布入口。

## DevOps Notes

### Static Assets

- `worker/wrangler.jsonc` 中配置了：
  - `assets.directory: "../frontend/dist"`
- Worker 发布时会把静态资源和 API 一起挂到同一个域名下

### D1

- 当前数据库绑定名：`my_db`
- 数据库名：`my-db`
- Worker 在请求过程中会自动确保用户表和新增字段存在

### Domain

- 当前生产域名：`yihong1031.com`
- 也会生成一个 `workers.dev` 地址作为 Worker 发布结果

## Recommended Contributor Reading Order

1. 先读本文件，理解整体架构
2. 再读 [frontend/README.md](/workspaces/myresume/frontend/README.md)
3. 最后读 [worker/README.md](/workspaces/myresume/worker/README.md)

## Current Product Scope

当前已经完成：

- 作品集首页
- mini tools 弹窗
- QR / Barcode 匿名可用
- 注册 / 登录
- 登录后跳转后台
- Dashboard 资料管理
- `yukang` 专属 users management
- Cloudflare D1 持久化
- `deploy:full` 一键发布

后续适合继续扩展：

- dashboard 内更多工具
- 管理员权限
- 用户列表与审计
- 更完整的密码安全策略
