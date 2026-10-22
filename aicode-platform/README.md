# aicode-platform（Java API）

Spring Boot 2.7 + JPA + MySQL 5.7，多租户（tenant 在 JWT 内，可选 Header `X-Tenant-Id`）。

## 本地环境

| 项 | 值 |
|----|-----|
| 服务端口 | 8080 |
| 数据库 | `127.0.0.1:3306/mfe` |
| 账号 | `root` / `root` |

```bash
docker compose up -d    # 起 MySQL 并执行 sql/init.sql
mvn spring-boot:run
curl http://localhost:8080/api/health
```

配置：`src/main/resources/application.yml`

## 接口一览

统一响应：`{ "code": 0, "message": "ok", "data": ... }`，`code !== 0` 为业务错误。

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/api/health` | 否 | 健康检查 |
| POST | `/api/auth/login` | 否 | 登录，body: `{ "tenantCode", "email", "password" }` |
| GET | `/api/auth/me` | Bearer | 当前会话、租户、角色与权限 |
| GET | `/api/menus` | Bearer | 当前租户菜单 |
| GET | `/api/dashboard/stats` | Bearer | 工作台统计 |
| GET | `/api/products` | Bearer | 商品列表（按租户） |
| GET | `/api/products/{id}` | Bearer | 商品详情 |
| POST | `/api/products` | `product:create` | 新建商品 |
| GET | `/api/product-categories` | `product:category` | 商品分类 |
| GET | `/api/user/profile` | Bearer | 当前用户资料 |
| PUT | `/api/user/profile` | `user:profile:update` | 修改名称与手机号 |
| GET | `/api/admin/bootstrap` | 任一 `admin:*:view` | 治理页初始化数据 |
| POST/PUT | `/api/admin/users/**` | `admin:members:create` / `assign-role` | 成员与角色绑定 |
| POST/PUT/DELETE | `/api/admin/roles/**` | `admin:roles:*` | 角色与权限矩阵 |
| POST/PUT/DELETE | `/api/admin/permissions` | `admin:permissions:*` | 权限目录（页面含 path/icon，同步 route_catalog + 侧栏） |

请求头（除 login / health 外）：

- `Authorization: Bearer <token>`
- `X-Tenant-Id: <tenantId>`（可选；若传则须与 token 内租户一致）

登录响应 `data` 示例：

```json
{
  "token": "...",
  "tenantId": 1,
  "tenantName": "演示租户",
  "tenantCode": "demo",
  "userId": 1,
  "email": "demo@company.com",
  "name": "Alex"
}
```

## 代码结构

```
com.mfe.platform
├── web/           Controller、DTO
├── domain/        实体
├── repo/          JpaRepository
├── auth/          JWT、Filter
├── tenant/        TenantContext
└── common/        ApiResponse、异常
```

前端通过 Vite 代理或网关把 `/api` 指到 `http://localhost:8080` 即可联调。

## 权限与租户

角色、权限、用户角色和角色权限分别存储在 `role`、`permission`、`user_role`、
`role_permission`。菜单通过 `permission_code` 过滤，业务接口通过
`@RequirePermission` 做最终校验。详细规则见工作区
[`ARCHITECTURE.md`](../ARCHITECTURE.md)。

已有数据库执行 `sql/migrate-rbac.sql`；全新数据库会由 `sql/init.sql` 初始化。
