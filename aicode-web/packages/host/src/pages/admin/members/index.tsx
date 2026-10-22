import AdminApp from '@/pages/admin/AdminApp'
import AdminPageShell from '@/pages/admin/AdminPageShell'
import MembersPanel from '@/pages/admin/members/MembersPanel'
import { useAdminWorkspace } from '@/pages/admin/useAdminWorkspace'

function MembersPageInner() {
  const { data, loading, notify, run } = useAdminWorkspace()

  return (
    <AdminPageShell
      title="成员管理"
      description="管理本租户登录账号，并通过角色绑定继承权限。页面入口权限 admin:members:view；新建与分配角色为独立按钮权限。"
      stats={
        data
          ? [
              { label: '成员数', value: data.users.length },
              { label: '可用角色', value: data.roles.length },
            ]
          : undefined
      }
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
