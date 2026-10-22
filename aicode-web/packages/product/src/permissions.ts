import type { SubsystemPermissionManifest } from '@aicode/shared/permissions'

/** Product 微前端向 Host 注册的权限清单（Remote 自声明 + 后端 API 校验） */
export const productPermissionManifest: SubsystemPermissionManifest = {
  subsystem: 'product',
  label: '商品子系统',
  permissions: [
    { code: 'product:list', name: '商品列表', kind: 'page' },
    { code: 'product:view', name: '商品详情', kind: 'page' },
    { code: 'product:category', name: '商品分类', kind: 'page' },
    { code: 'product:create', name: '新建商品', kind: 'action', parentCode: 'product:list' },
  ],
}
