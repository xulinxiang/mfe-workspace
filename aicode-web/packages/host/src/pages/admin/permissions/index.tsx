import AdminApp from '@/pages/admin/AdminApp'
import AdminPageShell from '@/pages/admin/AdminPageShell'
import PermissionsPanel from '@/pages/admin/permissions/PermissionsPanel'
import { useAdminWorkspace } from '@/pages/admin/useAdminWorkspace'

function PermissionsPageInner() {
  const { data, loading, run } = useAdminWorkspace()

  return (
    <AdminPageShell title="权限目录" loading={loading || !data}>
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
