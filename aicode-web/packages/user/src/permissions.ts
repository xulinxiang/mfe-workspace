import type { SubsystemPermissionManifest } from '@aicode/shared/permissions'

export const userPermissionManifest: SubsystemPermissionManifest = {
  subsystem: 'user',
  label: '用户子系统',
  permissions: [
    { code: 'user:profile', name: '个人资料', kind: 'page' },
    { code: 'user:profile:update', name: '修改资料', kind: 'action', parentCode: 'user:profile' },
  ],
}
