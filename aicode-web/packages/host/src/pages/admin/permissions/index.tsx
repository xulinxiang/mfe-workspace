import AdminApp from '@/pages/admin/AdminApp'
import AdminPageShell from '@/pages/admin/AdminPageShell'
import PermissionsPanel from '@/pages/admin/permissions/PermissionsPanel'
import { useAdminWorkspace } from '@/pages/admin/useAdminWorkspace'

function PermissionsPageInner() {
  const { data, loading, run } = useAdminWorkspace()

  return (
    <AdminPageShell
      title="权限目录"
      description="按子系统维护可折叠的目录、菜单和按钮权限，支持嵌套与排序。"
      loading={loading && !data}
    >
      {data ? <PermissionsPanel data={data} run={run} /> : null}
    </AdminPageShell>
  )
}

export default function AdminPermissionsPage() {
  return (
    <AdminApp>
      <PermissionsPageInner />
    </AdminApp>
  )
}
