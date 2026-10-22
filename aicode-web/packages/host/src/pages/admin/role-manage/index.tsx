import AdminApp from '@/pages/admin/AdminApp'
import AdminPageShell from '@/pages/admin/AdminPageShell'
import RoleManagePanel from '@/pages/admin/role-manage/RoleManagePanel'
import { useAdminWorkspace } from '@/pages/admin/useAdminWorkspace'

function RoleManageInner() {
  const { data, loading, run } = useAdminWorkspace()

  return (
    <AdminPageShell
      title="角色管理"
      description="维护租户内角色的编码与名称，支持新建、编辑与删除；为角色配置页面与按钮权限请到「角色与权限」。"
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
