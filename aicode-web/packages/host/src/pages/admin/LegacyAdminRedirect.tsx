import { Navigate, useLocation } from 'react-router-dom'

/** 旧 /system/* 书签兼容 */
export default function LegacyAdminRedirect() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/system/menus')) return <Navigate to="/admin/permissions" replace />
  if (pathname.startsWith('/system/roles')) return <Navigate to="/admin/roles" replace />
  return <Navigate to="/admin/members" replace />
}
