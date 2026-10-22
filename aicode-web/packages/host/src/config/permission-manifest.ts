import { ADMIN } from '@/config/admin-permissions'
import type { SubsystemPermissionManifest } from '@aicode/shared/permissions'

export const hostPermissionManifest: SubsystemPermissionManifest = {
  subsystem: 'host',
  label: '主应用',
  permissions: [
    { code: 'dashboard:view', name: '工作台', kind: 'page' },
    { code: ADMIN.members.view, name: '成员管理', kind: 'page' },
    { code: ADMIN.members.create, name: '新建成员', kind: 'action', parentCode: ADMIN.members.view },
    {
      code: ADMIN.members.assignRole,
      name: '分配角色',
      kind: 'action',
      parentCode: ADMIN.members.view,
    },
    { code: ADMIN.roles.view, name: '角色与权限', kind: 'page' },
    { code: ADMIN.roles.create, name: '新建角色', kind: 'action', parentCode: ADMIN.roles.view },
    { code: ADMIN.roles.delete, name: '删除角色', kind: 'action', parentCode: ADMIN.roles.view },
    {
      code: ADMIN.roles.assignPermissions,
      name: '配置权限矩阵',
      kind: 'action',
      parentCode: ADMIN.roles.view,
    },
    { code: ADMIN.permissions.view, name: '权限目录', kind: 'page' },
    {
      code: ADMIN.permissions.create,
      name: '新建权限',
      kind: 'action',
      parentCode: ADMIN.permissions.view,
    },
    {
      code: ADMIN.permissions.update,
      name: '编辑权限',
      kind: 'action',
      parentCode: ADMIN.permissions.view,
    },
    {
      code: ADMIN.permissions.delete,
      name: '删除权限',
      kind: 'action',
      parentCode: ADMIN.permissions.view,
    },
  ],
}
