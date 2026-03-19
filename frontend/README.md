# Frontend

`frontend/` 是这个项目的 React 单页应用，负责公开展示页、工具弹窗、登录交互，以及登录后的 dashboard UI。

它不是单独部署的前端站点。最终部署时会先构建出 `dist/`，然后由 `worker/` 作为 Cloudflare 静态资源进行托管。

## Responsibilities

前端当前承担四类职责：

- 作品集首页展示
- mini tools 弹窗和浏览器端工具
- 注册 / 登录交互
- 登录后 dashboard 页面

## Key Files

### App And Routing

- `src/main.jsx`
  - React 应用挂载入口
- `src/App.jsx`
  - 路由定义
  - 当前包含：
    - `/`
    - `/dashboard`

### Public Pages

- `src/pages/Home.jsx`
  - 首页装配层
- `src/components/Header.jsx`
  - 顶部导航
- `src/components/mini_Tools.jsx`
  - mini tools 弹窗入口

### Dashboard

- `src/pages/Dashboard.jsx`
  - 登录后的后台页
  - 负责：
    - 请求 `/api/auth/me`
    - 显示当前用户资料
    - 请求 `/api/profile`
    - 请求 `/api/auth/logout`
    - 呈现 tools 区域

### Tools

- `src/tools/qr_generator.jsx`
- `src/tools/barcode_generator.jsx`
- `src/tools/heic_to_jpg.jsx`
- `src/tools/auth_tool.jsx`

其中：

- QR / Barcode / HEIC 工具是纯浏览器侧工具
- `auth_tool.jsx` 会调用 Worker 的 auth API

## UI Flow

### Public Flow

1. 用户进入首页
2. 通过顶部 `Tools()` 打开工具弹窗
3. 可使用工具，或打开 `Register / Login`

### Login Flow

1. 用户在 `auth_tool.jsx` 中注册或登录
2. 登录时前端请求 `/api/auth/login`
3. Worker 返回 session cookie
4. 前端登录成功后跳转 `/dashboard`

### Dashboard Flow

1. 页面加载后请求 `/api/auth/me`
2. 如果未登录，显示访问受限状态
3. 如果已登录，展示：
   - Welcome 区
   - Profile Settings
   - Tools 区
4. 用户可更新：
   - `display_name`
   - `email`
   - `phone`
   - `password`

## API Dependencies

前端依赖这些后端接口：

- `GET /api`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/profile`

## Local Development

### Install

```bash
cd /workspaces/myresume/frontend
npm install
```

### Run

```bash
npm run dev
```

默认地址通常是：

```text
http://localhost:5173
```

## API Proxy

`vite.config.ts` 已配置：

- `/api` -> `http://127.0.0.1:8787`

这意味着本地开发时：

- React 在 `5173`
- Worker 在 `8787`
- 前端代码仍然可以直接用相对路径 `/api/...`

## Build

```bash
cd /workspaces/myresume/frontend
npm run build
```

产物输出到：

```text
frontend/dist
```

该目录会被 `worker/wrangler.jsonc` 的 `assets.directory` 引用。

## Deployment Relationship

不要把这个目录理解成独立部署单元。正确关系是：

1. `frontend` build 出 `dist`
2. `worker` 把 `dist` 当成静态资源发布
3. 同一域名同时提供页面和 API

## Styling Notes

- 全局样式入口：`src/index.css`
- 当前视觉语言偏深色、霓虹高对比
- Dashboard 和公开页共享同一套 CSS 变量

## Recommended Edit Rules

如果你后续继续改这里，建议遵守：

- 展示页和 dashboard 的职责分清
- 工具类逻辑优先放在 `src/tools/`
- 页面装配优先放在 `src/pages/`
- 通用 UI 组件留在 `src/components/`
- 所有后端请求继续统一走 `/api/...`
