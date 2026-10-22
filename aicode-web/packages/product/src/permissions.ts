import type { SubsystemPermissionManifest } from '@aicode/shared/permissions'

export const PRODUCT = {
  list: 'product:list',
  view: 'product:view',
  create: 'product:list:create',
  update: 'product:list:update',
  delete: 'product:list:delete',
  category: 'product:category',
  categoryCreate: 'product:category:create',
  categoryUpdate: 'product:category:update',
  categoryDelete: 'product:category:delete',
} as const

export const productPermissionManifest: SubsystemPermissionManifest = {
  subsystem: 'product',
  label: '商品子系统',
  permissions: [
    { code: PRODUCT.list, name: '商品列表', kind: 'page' },
    { code: PRODUCT.create, name: '新建商品', kind: 'action', parentCode: PRODUCT.list },
    { code: PRODUCT.update, name: '编辑商品', kind: 'action', parentCode: PRODUCT.list },
    { code: PRODUCT.delete, name: '删除商品', kind: 'action', parentCode: PRODUCT.list },
    { code: PRODUCT.category, name: '商品分类', kind: 'page' },
    {
      code: PRODUCT.categoryCreate,
      name: '新建分类',
      kind: 'action',
      parentCode: PRODUCT.category,
    },
    {
      code: PRODUCT.categoryUpdate,
      name: '编辑分类',
      kind: 'action',
      parentCode: PRODUCT.category,
    },
    {
      code: PRODUCT.categoryDelete,
      name: '删除分类',
      kind: 'action',
      parentCode: PRODUCT.category,
    },
  ],
}
