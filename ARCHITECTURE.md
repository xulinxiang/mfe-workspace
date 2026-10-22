# Aicode 微前端与多租户权限架构

## 边界

- `aicode-web/packages/host`：登录、会话、布局、菜单、远程应用挂载、路由权限。
- `aicode-web/packages/product`：商品业务路由与页面。
- `aicode-web/packages/user`：用户资料业务页面。
- `aicode-web/libs/shared`（`@aicode/shared`）：Host 与子应用共用的 token 存储、租户请求头和 API 客户端。
- `aicode-web/libs/pro-ui`（`@aicode/pro-ui`）：Ant Design Pro 可选封装，与 `packages/` 子系统分离。
- `aicode-platform`：租户、用户、角色、权限、菜单过滤和最终 API 鉴权。

## 路由规则

- Host 只注册远程挂载点：`/product/*`、`/user/*`。
- 子应用维护挂载点内的相对路由，例如 `product` 的 `create`、`category`、`detail/:id`。
- Host 的 `route-registry.ts` 维护挂载点及页面权限映射。
- 菜单来自 `GET /api/menus`，数据库菜单 path 必须落在已注册挂载点中。

## RBAC

关系为：

`app_user -> user_role -> role -> role_permission -> permission`

菜单的 `permission_code` 控制入口是否下发；`@RequirePermission` 控制接口是否允许执行。
前端菜单隐藏和路由守卫用于体验，后端权限注解是安全边界。

## 微前端权限（国际通行做法）

与 OWASP、Module Federation 门户（如 Zalando）、FrontHub 等实践对齐：

1. **Host 集中身份**  
   登录后 `GET /api/auth/me` 下发 **扁平 `permissions[]`**（有效权限集）。Host 与各 Remote 共用 `@aicode/shared/auth` 读取，**仅用于 UI 显隐**，不可当作安全边界。

2. **命名：`resource:action`**  
   一条 permission 一个码，例如 `product:list`（页面）、`product:create`（操作）。数据库 `resource_type`：`page` = 菜单/路由入口，`action` = 按钮/写操作；`parent_code` 指向所属页面权限。

3. **三层映射**  
   | 层 | 配置位置 | 作用 |
   |----|----------|------|
   | 目录 | `route_catalog.permission_code` | 子系统标准路由的 **页面** 权限 |
   | 菜单 | `menu_item.permission_code` | 租户侧栏是否展示（通常与页面码一致） |
   | 按钮 | 各 MFE `permissions.ts` manifest + 页面内 `<Can>` / `hasPermission` | 页内操作；**API 必须 `@RequirePermission`** |

4. **各 Remote 自声明**  
   - Host：`packages/host/src/config/permission-manifest.ts`  
   - Product：`packages/product/src/permissions.ts`  
   - User：`packages/user/src/permissions.ts`  
   运行时以 DB + 角色矩阵为准；manifest 用于对照与后续 CI 校验。

5. **后端统一鉴权**  
   所有 `/api/**` 在平台服务校验 JWT、租户与 permission；微前端无法绕过。

迁移：`aicode-platform/sql/migrate-permission-granularity.sql`（已有库执行一次）。

当前权限（节选）：

- 页面：`dashboard:view`、`product:list`、`admin:members:view`、`admin:roles:view`、`admin:permissions:view` …
- 操作：`product:create`、`admin:members:create`、`admin:roles:assign-permissions` …

## 租户治理（admin / IAM）

与门户/Module Federation 常见做法一致：**每个治理能力 = 侧栏菜单 + Host 路由 + page 权限 + 若干 action 权限（`<Can>` + API）**。

| 菜单 | 路由 | 页面权限 | 典型按钮权限 |
|------|------|----------|--------------|
| 成员管理 | `/admin/members` | `admin:members:view` | `create`、`assign-role` |
| 角色管理 | `/admin/role-manage` | `admin:role-manage:view` | `create`、`update`、`delete` |
| 角色与权限 | `/admin/roles` | `admin:roles:view` | `assign-permissions` |
| 权限目录 | `/admin/permissions` | `admin:permissions:view` | `create`（目录/菜单/按钮，菜单含 path/icon 同步侧栏）、`update`、`delete`、同级排序 |

配置：`packages/host/src/config/admin-permissions.ts`（与 DB、`SystemAdminController` 一致）。

已有库执行：`migrate-admin-iam.sql`、`migrate-admin-permissions-catalog.sql`、`migrate-role-manage.sql`、`migrate-menu-tree.sql`。

## 多租户

- JWT 固化 `userId` 与 `tenantId`。
- 每个请求由 `AuthFilter` 校验 token，并拒绝与 `X-Tenant-Id` 不一致的请求。
- Repository 查询必须同时使用当前 `tenantId`，避免跨租户读写。
- 角色属于租户；同名角色在不同租户相互独立。

## 会话启动

1. `POST /api/auth/login` 获取 token 和租户。
2. `GET /api/auth/me` 获取最新角色与权限。
3. `GET /api/menus` 获取按权限过滤后的真实菜单。
4. Host 根据权限注册守卫并加载远程页面。

权限不写入 JWT，而是后端每次请求实时查询，因此角色变更无需等待 token 过期。

## 演示账号

- 管理员：`demo@company.com / demo123`
- 只读用户：`viewer@company.com / demo123`
- 第二租户：`partner@company.com / demo123`

第二租户只看到自己的菜单、统计、商品和资料。
