# Worker

`worker/` 是这个项目的后端和部署壳层，运行在 Cloudflare Workers 上。

它的职责不是只做 API。它同时负责：

- API 路由
- D1 数据访问
- 登录 session cookie
- 托管 `frontend/dist`
- SPA fallback

## Core Role

这个 Worker 是项目的统一入口。

请求到达后，大致分两类：

- `/api/*`
  - 进入 Worker 后端逻辑
- 非 `/api/*`
  - 作为静态资源请求处理
  - 如果找不到具体资源，回退到 `index.html`

这让整个项目只需要一个 Cloudflare 部署单元。

## Key Files

- `src/index.ts`
  - Worker 主入口
  - 负责 schema 初始化、路由转发、静态资源 fallback
- `src/router.ts`
  - API 路由分发层
- `src/handlers/auth.ts`
  - 注册、登录、当前用户、登出
- `src/handlers/profile.ts`
  - 个人资料修改
- `src/handlers/admin.ts`
  - `users_management` 管理能力
- `src/users/schema.ts`
  - D1 用户表结构补齐
- `src/users/session.ts`
  - session、cookie、current user、admin 校验
- `src/http.ts`
  - JSON 响应和请求体工具
- `src/config.ts`
  - CORS、cookie、root admin 常量
- `wrangler.jsonc`
  - Cloudflare Worker 配置
  - 包含：
    - `main`
    - `assets.directory`
    - `routes`
    - `d1_databases`
- `package.json`
  - Worker 本地开发和部署脚本

## Runtime Responsibilities

### API

当前 API 包括：

- `GET /api`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/profile`
- `GET /api/admin/users`
- `POST /api/admin/users/delete`
- `POST /api/admin/users/reset-password`

### Database

使用 Cloudflare D1。

当前数据库绑定：

- binding: `my_db`
- database name: `my-db`

### Session

登录成功后：

1. Worker 生成随机 session token
2. 写入 D1 用户表
3. 返回 `Set-Cookie`
4. 后续通过 cookie 识别当前用户

当前 cookie 策略：

- `HttpOnly`
- `Secure`
- `SameSite=Lax`
- `Max-Age=604800`

## Data Model

当前 `users` 表逻辑字段包括：

- `id`
- `username`
- `password_hash`
- `display_name`
- `email`
- `phone`
- `session_token`
- `session_expires_at`
- `created_at`

Worker 会在请求中自动确保这些结构存在，所以当前不是手动 migration 方案，而是“启动时自修复式 schema 补齐”。

## Admin Rule

当前存在一个硬编码的 root admin：

- `username === "yukang"`

只有这个账号可以访问 `users_management` 相关接口。

并且后端会强制保护 `yukang` 本人：

- 不能删除 `yukang`
- 不能强制重置 `yukang` 的密码
- 这条保护不仅是前端 UI 限制，也是后端接口限制

## Static Asset Hosting

`wrangler.jsonc` 中的关键配置是：

```jsonc
"assets": {
  "directory": "../frontend/dist",
  "binding": "ASSETS",
  "run_worker_first": true
}
```

这意味着：

- 必须先构建前端
- Worker 发布时会把 `frontend/dist` 一起发布

## Local Development

### Install

```bash
cd /workspaces/myresume/worker
npm install
```

### Run Worker Locally

```bash
npm run dev
```

通常会在：

```text
http://localhost:8787
```

## Deploy

### Worker Only

如果你已经确认 `frontend/dist` 是最新的：

```bash
cd /workspaces/myresume/worker
npm run deploy
```

### Full Deploy

标准做法是：

```bash
cd /workspaces/myresume/worker
npm run deploy:full
```

这个命令会调用根目录的 `update_deploy.sh`，顺序是：

1. build `frontend`
2. deploy `worker`

所以 `deploy:full` 是推荐生产发布方式。

## Wrangler Notes

`wrangler.jsonc` 当前承担：

- Worker 名称
- `src/index.ts` 入口指定
- `assets.directory`
- `workers_dev`
- 自定义域名 route
- D1 数据库绑定

## Operational Guidance

如果线上出现问题，优先排查顺序：

1. `worker/src/router.ts` 的路由分发是否命中
2. `worker/src/handlers/*` 的 API 逻辑
3. `worker/src/users/session.ts` 的 cookie / current user 判断
4. `worker/wrangler.jsonc` 的绑定和 assets 配置
5. Cloudflare Worker logs
6. D1 schema 与会话字段
7. `frontend/dist` 是否为最新构建

## Practical Rule

只要改了前端页面或前端逻辑，就不要只跑 `wrangler deploy`。

应该优先用：

```bash
npm run deploy:full
```

这样不会把旧的 `dist` 发布到线上。
