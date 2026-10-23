# libs

与 `packages/`（微前端子系统）分离的公共库：

| 包 | 用途 |
|----|------|
| `@aicode/shared` | 请求封装 `api`、登录态 `auth` |
| `@aicode/pro-ui` | Ant Design Pro 可选 `AppProProvider`、菜单转换工具 |

子系统 `package.json` 里声明 `"@aicode/shared": "1.0.0"` 即可。

**商业化交付**：商品 / 用户等子系统应增加 `"@aicode/pro-ui": "1.0.0"`，在 `App` 根节点包 `AppProProvider`，表单与弹窗统一使用 `antd`（`Form`、`Input`、`Select`、`Modal`）。不必整站 ProTable/ProLayout，按需再引入 Pro 组件。

**antd 版本**：仅在 `@aicode/pro-ui` 声明并锁定（当前 antd `5.22.5`）；根目录 `package.json` 的 `overrides` 保证全 monorepo 同一版本。升级时在 pro-ui 改版本号并全量 rebuild host + 各 remote；CI 使用 `npm ci`。
