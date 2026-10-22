import AdminApp from '@/pages/admin/AdminApp'
import AdminPageShell from '@/pages/admin/AdminPageShell'
import RolesPanel from '@/pages/admin/roles/RolesPanel'
import { useAdminWorkspace } from '@/pages/admin/useAdminWorkspace'

function RolesPageInner() {
  const { data, loading, run, setData } = useAdminWorkspace()

  return (
    <AdminPageShell title="角色与权限" loading={loading || !data}>
      {data ? <RolesPanel data={data} run={run} onDataChange={setData} /> : null}
    </AdminPageShell>
  )
}

export default function AdminRolesPage() {
  return (
    <AdminApp>
      <RolesPageInner />
    </AdminApp>
  )
}
