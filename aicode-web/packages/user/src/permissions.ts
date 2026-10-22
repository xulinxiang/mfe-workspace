import type { SubsystemPermissionManifest } from '@aicode/shared/permissions'

export const USER = {
  list: 'user:list',
  create: 'user:list:create',
  update: 'user:list:update',
  delete: 'user:list:delete',
  profile: 'user:profile',
  profileUpdate: 'user:profile:update',
} as const

export const userPermissionManifest: SubsystemPermissionManifest = {
  subsystem: 'user',
  label: '用户子系统',
  permissions: [
    { code: USER.list, name: '用户列表', kind: 'page' },
    { code: USER.create, name: '新建用户', kind: 'action', parentCode: USER.list },
    { code: USER.update, name: '编辑用户', kind: 'action', parentCode: USER.list },
    { code: USER.delete, name: '删除用户', kind: 'action', parentCode: USER.list },
    { code: USER.profile, name: '个人资料', kind: 'page' },
    { code: USER.profileUpdate, name: '修改资料', kind: 'action', parentCode: USER.profile },
  ],
}
