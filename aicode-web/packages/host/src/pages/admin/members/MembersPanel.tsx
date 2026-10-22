import {
  createUser,
  parseIds,
  updateUserRoles,
  type AdminBootstrap,
  type CreateUserPayload,
} from '@/api/admin'
import Can from '@/components/Can'
import { ADMIN } from '@/config/admin-permissions'
import { useAuth } from '@/context/AuthContext'
import { Checkbox, Form, Input, Modal } from 'antd'
import { useMemo, useState } from 'react'
import styles from '../admin.module.scss'

type Props = {
  data: AdminBootstrap
  run: (action: () => Promise<unknown>, success: string) => Promise<void>
  notify: (text: string, kind: 'success' | 'error') => void
}

export default function MembersPanel({ data, run, notify }: Props) {
  const { hasPermission } = useAuth()
  const [roleUserId, setRoleUserId] = useState<number | null>(null)
  const [roleDraft, setRoleDraft] = useState<number[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [form] = Form.useForm<CreateUserPayload>()

  const roleUser = useMemo(
    () => data.users.find((u) => u.id === roleUserId) ?? null,
    [data.users, roleUserId],
  )

  const canAssign = hasPermission(ADMIN.members.assignRole)

  async function submitCreate() {
    try {
      const values = await form.validateFields()
      if (!values.roleIds?.length) {
        notify('请至少选择一个角色', 'error')
        return
      }
      await run(
        async () => {
          await createUser({
            email: values.email.trim(),
            password: values.password,
            name: values.name.trim(),
            phone: values.phone?.trim() || undefined,
            roleIds: values.roleIds,
          })
          setCreateOpen(false)
        },
        '成员已创建',
      )
    } catch {
      /* 校验 */
    }
  }

  return (
    <>
      <article className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>租户成员</h2>
          <Can permission={ADMIN.members.create}>
            <button type="button" className={styles.btnPrimary} onClick={() => setCreateOpen(true)}>
              新建成员
            </button>
          </Can>
        </div>
        <div className={styles.panelBody}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>成员</th>
                <th>已授权角色</th>
                <th>展示标签</th>
                {canAssign ? <th>操作</th> : null}
              </tr>
            </thead>
            <tbody>
              {data.users.map((row) => {
                const ids = parseIds(row.roleIds)
                return (
                  <tr key={row.id}>
                    <td>
                      <div className={styles.userCell}>
                        <strong>{row.name}</strong>
                        <span>{row.email}</span>
                      </div>
                    </td>
                    <td>
                      {ids.length === 0 ? (
                        <span className={`${styles.tag} ${styles.tagMuted}`}>未分配</span>
                      ) : (
                        ids.map((id) => {
                          const role = data.roles.find((r) => r.id === id)
                          return (
                            <span key={id} className={styles.tag}>
                              {role?.name ?? id}
                            </span>
                          )
                        })
                      )}
                    </td>
                    <td>{row.roleLabel || '—'}</td>
                    {canAssign ? (
                      <td>
                        <Can permission={ADMIN.members.assignRole}>
                          <button
                            type="button"
                            className={styles.btnLink}
                            onClick={() => {
                              setRoleUserId(row.id)
                              setRoleDraft(parseIds(row.roleIds))
                            }}
                          >
                            分配角色
                          </button>
                        </Can>
                      </td>
                    ) : null}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </article>

      <Modal
        title="新建成员"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={submitCreate}
        okText="创建"
        destroyOnClose
        width={480}
      >
        <p style={{ color: 'rgba(0,0,0,0.45)', marginBottom: 16 }}>
          登录方式：租户编码 + 邮箱 + 密码。创建后可在列表中分配角色。
        </p>
        <Form form={form} layout="vertical" initialValues={{ roleIds: [] }}>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="name@company.com" />
          </Form.Item>
          <Form.Item
            name="password"
            label="初始密码"
            rules={[{ required: true, min: 6, message: '至少 6 位' }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机">
            <Input placeholder="可选" />
          </Form.Item>
          <Form.Item name="roleIds" label="初始角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Checkbox.Group>
              {data.roles.map((r) => (
                <Checkbox key={r.id} value={r.id}>
                  {r.name}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={roleUser ? `分配角色 · ${roleUser.name}` : '分配角色'}
        open={roleUserId != null}
        onCancel={() => setRoleUserId(null)}
        onOk={() => {
          if (roleUserId == null) return
          if (!roleDraft.length) {
            notify('至少保留一个角色', 'error')
            return
          }
          run(
            async () => {
              await updateUserRoles(roleUserId, roleDraft)
              setRoleUserId(null)
            },
            '角色已更新',
          )
        }}
        okText="保存"
        destroyOnClose
      >
        <Checkbox.Group
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          value={roleDraft}
          onChange={(vals) => setRoleDraft(vals as number[])}
          options={data.roles.map((r) => ({ label: `${r.name}（${r.code}）`, value: r.id }))}
        />
      </Modal>
    </>
  )
}
