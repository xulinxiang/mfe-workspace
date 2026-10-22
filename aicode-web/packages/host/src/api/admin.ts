import { apiRequest } from '@/api/client'

export type AdminUser = {
  id: number
  email: string
  name: string
  roleLabel: string
  roleIds: string | number | null
}

export type AdminRole = {
  id: number
  code: string
  name: string
  permissionIds: string | number | null
}

export type AdminPermission = {
  id: number
  code: string
  name: string
  subsystem?: string | null
  resourceType?: 'page' | 'action' | string | null
  parentCode?: string | null
  sortOrder?: number | null
}

export type AdminMenuItem = {
  id: number
  menuKey: string
  label: string
  path: string
  app?: string | null
  icon?: string | null
  permission?: string | null
  nodeType: 'route' | 'group' | string
  parentId?: number | null
  routeCatalogId?: number | null
  sortOrder: number
}

export type SubsystemEntry = {
  code: string
  name: string
  sortOrder: number
}

export type RouteCatalogEntry = {
  id: number
  subsystem: string
  routeKey: string
  label: string
  path: string
  icon?: string | null
  permission: string
  sortOrder: number
}

export type AdminBootstrap = {
  users: AdminUser[]
  roles: AdminRole[]
  permissions: AdminPermission[]
  subsystems: SubsystemEntry[]
  routeCatalog: RouteCatalogEntry[]
  menus?: AdminMenuItem[]
}

export type RolePayload = Pick<AdminRole, 'code' | 'name'>

export type CreateUserPayload = {
  email: string
  password: string
  name: string
  phone?: string
  roleIds: number[]
}

export const parseIds = (value: string | number | null) =>
  value == null
    ? []
    : String(value)
        .split(',')
        .filter(Boolean)
        .map(Number)

export function fetchAdminBootstrap() {
  return apiRequest<AdminBootstrap>('/api/admin/bootstrap')
}

export function createRole(payload: RolePayload) {
  return apiRequest<null>('/api/admin/roles', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateRole(id: number, payload: RolePayload) {
  return apiRequest<null>(`/api/admin/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteRole(id: number) {
  return apiRequest<null>(`/api/admin/roles/${id}`, { method: 'DELETE' })
}

export function updateRolePermissions(id: number, ids: number[]) {
  return apiRequest<null>(`/api/admin/roles/${id}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ ids }),
  })
}

export function updateUserRoles(id: number, ids: number[]) {
  return apiRequest<null>(`/api/admin/users/${id}/roles`, {
    method: 'PUT',
    body: JSON.stringify({ ids }),
  })
}

export function createUser(payload: CreateUserPayload) {
  return apiRequest<null>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export type PermissionPayload = {
  code: string
  name: string
  resourceType: 'page' | 'action'
  parentCode?: string | null
  subsystem?: string | null
  /** 页面权限：同步写入 route_catalog + 当前租户侧栏 */
  path?: string | null
  icon?: string | null
  parentMenuId?: number | null
  sortOrder?: number | null
}

export type MenuPayload = {
  key?: string
  label: string
  path?: string | null
  app?: string | null
  permission?: string | null
  icon?: string | null
  nodeType: 'group' | 'route'
  parentId?: number | null
  sortOrder?: number | null
}

export function createPermission(payload: PermissionPayload) {
  return apiRequest<null>('/api/admin/permissions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updatePermission(id: number, payload: PermissionPayload) {
  return apiRequest<null>(`/api/admin/permissions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deletePermission(id: number) {
  return apiRequest<null>(`/api/admin/permissions/${id}`, { method: 'DELETE' })
}

export function reorderPermissions(orderedIds: number[]) {
  return apiRequest<null>('/api/admin/permission-order', {
    method: 'PUT',
    body: JSON.stringify({ orderedIds }),
  })
}

export function createMenu(payload: MenuPayload) {
  return apiRequest<null>('/api/admin/menus', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateMenu(id: number, payload: MenuPayload) {
  return apiRequest<null>(`/api/admin/menus/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteMenu(id: number) {
  return apiRequest<null>(`/api/admin/menus/${id}`, { method: 'DELETE' })
}

export function reorderMenus(parentId: number | null, orderedIds: number[]) {
  return apiRequest<null>('/api/admin/menu-order', {
    method: 'PUT',
    body: JSON.stringify({ parentId, orderedIds }),
  })
}
