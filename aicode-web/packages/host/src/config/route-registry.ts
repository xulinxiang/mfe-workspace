import type { ComponentType } from 'react'
import { ADMIN_IAM_PAGES } from '@/config/admin-routes'
import Dashboard from '@/pages/dashboard'
import LegacyAdminRedirect from '@/pages/admin/LegacyAdminRedirect'
import AdminMembersPage from '@/pages/admin/members'
import AdminRoleManagePage from '@/pages/admin/role-manage'
import AdminRolesPage from '@/pages/admin/roles'
import AdminPermissionsPage from '@/pages/admin/permissions'

type RemoteModule = { default: ComponentType }

const ADMIN_PAGE_COMPONENTS: Record<string, ComponentType> = {
  'admin-members': AdminMembersPage,
  'admin-role-manage': AdminRoleManagePage,
  'admin-roles': AdminRolesPage,
  'admin-permissions': AdminPermissionsPage,
}

export type RouteRegistration = {
  key: string
  path: string
  name: string
  permission: string
  app: 'host' | 'product' | 'user'
  component?: ComponentType
  loader?: () => Promise<RemoteModule>
}

export const routeRegistry: RouteRegistration[] = [
  {
    key: 'dashboard',
    path: '/',
    name: '工作台',
    permission: 'dashboard:view',
    app: 'host',
    component: Dashboard,
  },
  ...ADMIN_IAM_PAGES.map((page) => ({
    key: page.key,
    path: page.path,
    name: page.name,
    permission: page.permission,
    app: 'host' as const,
    component: ADMIN_PAGE_COMPONENTS[page.key],
  })),
  {
    key: 'legacy-system',
    path: '/system/*',
    name: '旧系统路径',
    permission: 'dashboard:view',
    app: 'host',
    component: LegacyAdminRedirect,
  },
  {
    key: 'product',
    path: '/product/*',
    name: '商品应用',
    permission: 'product:list',
    app: 'product',
    loader: () => import('product_app/App'),
  },
  {
    key: 'user',
    path: '/user/*',
    name: '用户应用',
    permission: 'user:profile',
    app: 'user',
    loader: () => import('user_app/App'),
  },
]

export const routeMountGuide = routeRegistry
  .filter((r) => !r.path.endsWith('/*') && r.key !== 'legacy-system')
  .map(({ path, app, name }) => ({ path, app, name }))

export const routePermissions = [
  { path: '/', permission: 'dashboard:view' },
  ...ADMIN_IAM_PAGES.map(({ path, permission }) => ({ path, permission })),
  { path: '/product/create', permission: 'product:create' },
  { path: '/product/category', permission: 'product:category' },
  { path: '/product/detail/:id', permission: 'product:view' },
  { path: '/product/*', permission: 'product:list' },
  { path: '/user/*', permission: 'user:profile' },
]
