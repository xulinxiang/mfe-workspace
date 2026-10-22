import { Navigate, Outlet, matchPath, useLocation } from 'react-router-dom'
import { routePermissions } from '@/config/route-registry'
import { useAuth } from '@/context/AuthContext'
import { useMenus } from '@/context/MenuContext'
import { pickActiveMenuRoute } from '@/utils/menu-tree'

export default function PermissionRoute() {
  const { pathname } = useLocation()
  const { hasPermission } = useAuth()
  const { menus, loading } = useMenus()

  if (pathname === '/403') {
    return <Outlet />
  }

  const menuRoute = pickActiveMenuRoute(pathname, menus)
  if (menuRoute?.permission) {
    return hasPermission(menuRoute.permission) ? <Outlet /> : <Navigate to="/403" replace />
  }

  const route = routePermissions.find((item) =>
    matchPath({ path: item.path, end: true }, pathname),
  )
  if (!route) return <Outlet />
  if (route.path.includes('*') && loading) return <Outlet />
  if (!hasPermission(route.permission)) {
    return <Navigate to="/403" replace />
  }

  return <Outlet />
}
