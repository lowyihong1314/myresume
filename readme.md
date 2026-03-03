# MyResume

个人作品集站点，采用 `Vite + React` 前端与 `Cloudflare Worker` 边缘服务一体化部署。

## 项目特性

- 单页作品集（Hero / Skills / Experience / Projects / Contact / Footer）
- 响应式交互（桌面端 3D 项目轮播、移动端卡片列表）
- 顶部工具入口：
  - 二维码生成（`qrcode`）
  - 条形码生成（`jsbarcode`）
  - HEIC 转 JPG（`heic2any`，浏览器本地转换）
- Worker 提供：
  - `/api` 健康检查接口（返回 `{ ok: true }`）
  - 静态资源分发（`env.ASSETS.fetch`）
  - SPA 路由回退（404 时返回 `index.html`）

## 技术栈

- 前端：React 19, React Router 7, Vite 7, Framer Motion, Tailwind CSS 4
- 工具库：qrcode, jsbarcode, heic2any, react-type-animation
- 边缘：Cloudflare Workers（Wrangler 4）

## 目录结构

```text
.
├─ frontend/                # React 前端
│  ├─ src/
│  │  ├─ components/        # 页面组件与 mini tools 入口
│  │  ├─ pages/Home.jsx     # 首页拼装
│  │  ├─ tools/             # QR / Barcode / HEIC 工具实现
│  │  ├─ App.jsx            # 路由
│  │  └─ main.jsx           # 前端入口
│  └─ package.json
├─ worker/                  # Cloudflare Worker
│  ├─ src/index.ts          # API + 静态资源 + SPA fallback
│  ├─ wrangler.jsonc        # Worker 与路由配置
│  └─ package.json
└─ readme.md
```

## 本地开发

环境要求：

- Node.js 18+（建议 20+）
- npm

1. 安装依赖

```bash
cd frontend && npm install
cd ../worker && npm install
```

2. 启动前端开发服务器

```bash
cd frontend
npm run dev
```

3. 启动 Worker 本地服务

```bash
cd worker
npm run dev
```

说明：

- 前端默认由 Vite 提供（通常是 `http://localhost:5173`）
- Worker 由 Wrangler 提供（通常是 `http://localhost:8787`）

## 构建与部署

1. 构建前端静态资源

```bash
cd frontend
npm run build
```

2. 部署 Worker（携带 `../frontend/dist` 静态资源）

```bash
cd worker
npm run deploy
```

## 生产配置说明

- `worker/wrangler.jsonc` 已配置：
  - `assets.directory: "../frontend/dist"`
  - 自定义域名路由：`yihong1031.com`
  - `compatibility_date: "2025-10-08"`
  - `nodejs_compat` 兼容标志

如需切换域名或路由规则，直接修改 `worker/wrangler.jsonc` 中的 `routes` 与 `zone_name`。
