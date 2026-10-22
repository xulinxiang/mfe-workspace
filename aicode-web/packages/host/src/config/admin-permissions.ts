/**
 * Host 租户治理权限（与 route_catalog / menu_item / 后端 @RequirePermission 一致）
 * page = 侧栏 + 路由；action = 页内按钮（API 仍独立校验）
 */
export const ADMIN = {
  members: {
    view: 'admin:members:view',
    create: 'admin:members:create',
    assignRole: 'admin:members:assign-role',
  },
  roles: {
    view: 'admin:roles:view',
    create: 'admin:roles:create',
    delete: 'admin:roles:delete',
    assignPermissions: 'admin:roles:assign-permissions',
  },
  permissions: {
    view: 'admin:permissions:view',
    create: 'admin:permissions:create',
    update: 'admin:permissions:update',
    delete: 'admin:permissions:delete',
  },
} as const

export const ADMIN_PAGE_PERMISSIONS = [
  ADMIN.members.view,
  ADMIN.roles.view,
  ADMIN.permissions.view,
] as const
