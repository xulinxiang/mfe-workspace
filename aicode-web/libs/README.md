# libs

与 `packages/`（微前端子系统）分离的公共库：

| 包 | 用途 |
|----|------|
| `@aicode/shared` | 请求封装 `api`、登录态 `auth` |
| `@aicode/pro-ui` | Ant Design Pro 可选 `AppProProvider`、菜单转换工具 |

子系统 `package.json` 里声明 `"@aicode/shared": "1.0.0"` 即可；要用 Pro 时再增加 `"@aicode/pro-ui": "1.0.0"`。
