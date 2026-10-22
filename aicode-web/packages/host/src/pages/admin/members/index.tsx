import AdminApp from '@/pages/admin/AdminApp'
import AdminPageShell from '@/pages/admin/AdminPageShell'
import MembersPanel from '@/pages/admin/members/MembersPanel'
import { useAdminWorkspace } from '@/pages/admin/useAdminWorkspace'

function MembersPageInner() {
  const { data, loading, notify, run } = useAdminWorkspace()

  return (
    <AdminPageShell
      title="租户成员"
      description="管理当前租户下的登录账号：新建成员、维护资料，并为其分配角色；实际可见菜单与按钮权限由角色决定。"
      loading={loading || !data}
    >
      {data ? <MembersPanel data={data} run={run} notify={notify} /> : null}
    </AdminPageShell>
  )
}

export default function AdminMembersPage() {
  return (
    <AdminApp>
      <MembersPageInner />
    </AdminApp>
  )
}
