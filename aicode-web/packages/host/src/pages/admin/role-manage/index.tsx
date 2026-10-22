import AdminApp from '@/pages/admin/AdminApp'
import AdminPageShell from '@/pages/admin/AdminPageShell'
import RoleManagePanel from '@/pages/admin/role-manage/RoleManagePanel'
import { useAdminWorkspace } from '@/pages/admin/useAdminWorkspace'

function RoleManageInner() {
  const { data, loading, run } = useAdminWorkspace()

  return (
    <AdminPageShell
      title="角色管理"
      description="维护本租户角色的编码与名称。页面权限分配请到「角色与权限」。"
      stats={
        data
          ? [
              { label: '角色数', value: data.roles.length },
            ]
          : undefined
      }
      loading={loading || !data}
    >
      {data ? <RoleManagePanel data={data} run={run} /> : null}
    </AdminPageShell>
  )
}

export default function AdminRoleManagePage() {
  return (
    <AdminApp>
      <RoleManageInner />
    </AdminApp>
  )
}
