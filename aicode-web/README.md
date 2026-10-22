# aicode-web（运营控制台）

> **仓库位置**：本前端与 Java 接口分目录存放。推荐工作区布局见  
> [`../mfe-workspace/`](../mfe-workspace/)（`aicode-web` + `aicode-platform` 并列，命名参考 `aisports-web` / `aisports-api`）。  
> 接口项目在 **`../mfe-workspace/aicode-platform`**。

全 React + **Vite Module Federation**。目录约定：`packages/` **只放子系统**（host / product / user）；跨端 SDK 在 `libs/shared`，Pro 组件封装在 `libs/pro-ui`（按需引用，不换全局壳）。

```
aicode-web/
├── packages/          # 仅微前端子系统：host、product、user
└── libs/
    ├── shared/        # @aicode/shared — api、auth（Host + 子应用共用）
    └── pro-ui/        # @aicode/pro-ui — Ant Design Pro 可选封装
```

Pro 按需用法：`import { AppProProvider } from '@aicode/pro-ui'`

按现实后台常见分工落地：

- **Host**：真侧栏、顶栏、路由壳（生产唯一布局）
- **子应用**：只交付中间业务内容
- **Standalone**：子应用独立开发时的**假侧栏**（不上生产）

Host 与子应用同一套商业目录（`@/` 指向 `src`）：

```
src/
  api/           接口 / mock
  components/    通用组件（Host：RemoteApp）
  config/        菜单等配置
  layouts/       布局（Host 真壳 / 子应用 Standalone 假壳）
  pages/         页面，一页一个目录
  router/        路由表
  styles/        tokens + CSS Modules
  types/         类型
  utils/         工具（cx 等）
  App.tsx        入口壳
  main.tsx       启动（子应用在这里套假壳）
```

子应用页面示例：`pages/list`、`pages/category`、`pages/profile`。假壳在 `layouts/StandaloneLayout`，不会随 Federation 暴露。

样式约定：**CSS Modules + SCSS**（不用 Less）。类名编译为 `host_xxx` / `product_xxx` / `user_xxx`。Pro 组件与现有样式可并存，按页渐进接入。

## 环境

Node.js ≥ 18（推荐 20）

```bash
nvm use
npm install
npm run dev
```

| 你要做什么 | 打开地址 | 看到什么 |
|------------|----------|----------|
| 联调 / 提测（推荐） | http://localhost:5000 | Host **真菜单** + 远程子应用 |
| 只写商品 | http://localhost:5001 | 商品 **假侧栏** + 业务页 |
| 只写用户 | http://localhost:5002 | 用户 **假侧栏** + 业务页 |

> 子应用通过 `build --watch` + `preview` 提供 `remoteEntry.js`。首次等终端 `built` 后再点 Host 菜单。

## 现实分工（本仓库怎么对应）

```
┌──────────── Host 真壳 ─────────────┐
│ 侧栏菜单 │  顶栏 / 权限 / 登录      │
│ (menu.ts)│                         │
│          │  ┌─ product App ─────┐  │
│          │  │ 只有业务内容       │  │
│          │  └──────────────────┘  │
└──────────┴─────────────────────────┘

独立开发 product 时：
┌── Standalone 假壳（main.tsx）──┐
│ 假侧栏 │  同一个 product App   │
└────────┴───────────────────────┘
```

关键点：

1. Federation **只暴露** `./App`（业务内容），不暴露假壳
2. 假壳只挂在各子应用的 `main.tsx`，Host 加载时根本进不去
3. 真菜单在 `packages/host/src/config/menu.ts`

## 两种开发方式

### A. 挂 Host 联调（提测、对菜单、对权限）

```bash
npm run dev
# 浏览器只开 http://localhost:5000
```

### B. 子系统单独开发（日常写页面）

```bash
npm run dev:product   # 或 dev:user
# 打开对应端口，使用 standalone 假菜单
```

假壳代码：

- `packages/product/src/layouts/StandaloneLayout`
- `packages/user/src/layouts/StandaloneLayout`

## Module Federation 要点

子应用暴露：

```ts
exposes: { './App': './src/App.tsx' }
shared: ['react', 'react-dom']
```

Host 声明远程并懒加载：

```ts
remotes: {
  product_app: 'http://localhost:5001/assets/remoteEntry.js',
  user_app: 'http://localhost:5002/assets/remoteEntry.js',
}
// 路由里：import('product_app/App')
```

## 常用命令

```bash
npm run dev              # Host + 两子应用
npm run dev:host
npm run dev:product
npm run dev:user
npm run build            # 先子应用，再 Host
npm run preview          # 本地预览三份 dist
```

## 怎么打包 / 部署

微前端是**分开打包、分开部署**的，不是打成一个大包。

### 1. 本地一键构建

```bash
nvm use 20
npm run build
```

产物：

```
packages/product/dist/   ← 含 assets/remoteEntry.js
packages/user/dist/
packages/host/dist/      ← 主站静态资源
```

顺序必须是：**先 product / user，再 host**（根目录 `build` 脚本已按这个写）。

### 2. 分别部署到哪里

| 包 | 部署位置示例 | 浏览器访问 |
|----|--------------|------------|
| product | `https://cdn.example.com/product/` | 提供 `.../assets/remoteEntry.js` |
| user | `https://cdn.example.com/user/` | 同上 |
| host | `https://admin.example.com/` | 用户只开这个站 |

Host 运行时会按配置去拉子应用的 `remoteEntry.js`，再加载页面模块。

### 3. 改生产远程地址

编辑 `packages/host/.env.production`：

```env
VITE_PRODUCT_REMOTE=https://cdn.example.com/product/assets/remoteEntry.js
VITE_USER_REMOTE=https://cdn.example.com/user/assets/remoteEntry.js
```

再 `npm run build -w @mfe/host`。  
开发环境用 `.env.development`（默认 localhost）。

### 4. 本地验证生产包

```bash
npm run build
npm run preview
# 打开 http://localhost:5000
```

### 5. 和单体项目的差别（记这个就行）

- **子应用**：自己 CI 构建 `dist`，上传自己的目录/CDN；改商品不必重发 Host  
- **Host**：构建时把 remote URL 写进去（或运行时配置）；负责壳子和菜单  
- **CORS**：子应用静态资源域名要允许 Host 页面跨域拉取 JS  

单独只打某一个：

```bash
npm run build -w @mfe/product
npm run build -w @mfe/user
npm run build -w @mfe/host
```

## 建议练习

1. 改 `host/src/config/menu.ts` 增加菜单项，并在 `App.tsx` 加对应路由  
2. 只开 `:5001`，在假壳里切换「商品列表 / 商品分类」  
3. 再开 Host，确认侧栏进商品时**没有**假壳、只有业务内容  

## 常见问题

**Host 加载失败**  
确认 `http://localhost:5001/assets/remoteEntry.js` 能打开。

**子应用改了 Host 没变**  
等 watch 重新 `built` 后硬刷新。

**为什么假菜单不能点到别的子系统？**  
刻意的：跨系统页面应走 Host 真菜单；假壳只服务「本域页面」开发。
