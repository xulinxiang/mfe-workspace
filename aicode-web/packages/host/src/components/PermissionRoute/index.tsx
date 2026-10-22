import { Navigate, Outlet, matchPath, useLocation } from 'react-router-dom'
import { routePermissions } from '@/config/route-registry'
import { useAuth } from '@/context/AuthContext'

export default function PermissionRoute() {
  const { pathname } = useLocation()
  const { hasPermission } = useAuth()

  if (pathname === '/403') {
    return <Outlet />
  }

  const route = routePermissions.find((item) =>
    matchPath({ path: item.path, end: true }, pathname),
  )

  if (route && !hasPermission(route.permission)) {
    return <Navigate to="/403" replace />
  }

  return <Outlet />
}
