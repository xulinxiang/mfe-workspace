import { ADMIN } from '@/config/admin-permissions'

/** 租户治理：菜单 permission_code、Host 路由、route_catalog 须一致 */
export const ADMIN_IAM_PAGES = [
  {
    key: 'admin-members',
    path: '/admin/members',
    name: '成员管理',
    permission: ADMIN.members.view,
    menuKey: 'admin-members',
  },
  {
    key: 'admin-role-manage',
    path: '/admin/role-manage',
    name: '角色管理',
    permission: ADMIN.roleManage.view,
    menuKey: 'admin-role-manage',
  },
  {
    key: 'admin-roles',
    path: '/admin/roles',
    name: '角色与权限',
    permission: ADMIN.roles.view,
    menuKey: 'admin-roles',
  },
  {
    key: 'admin-permissions',
    path: '/admin/permissions',
    name: '权限目录',
    permission: ADMIN.permissions.view,
    menuKey: 'admin-permissions',
  },
] as const
