import {
  createUser,
  deleteUser,
  parseIds,
  updateUser,
  updateUserRoles,
  type AdminBootstrap,
  type AdminUser,
  type CreateUserPayload,
} from '@/api/admin'
import Can from '@/components/Can'
import { ADMIN } from '@/config/admin-permissions'
import { useAuth } from '@/context/AuthContext'
import { Checkbox, Form, Input, Modal, Popconfirm } from 'antd'
import { useMemo, useState } from 'react'
import styles from '../admin.module.scss'

type MemberForm = CreateUserPayload

type Props = {
  data: AdminBootstrap
  run: (action: () => Promise<unknown>, success: string) => Promise<void>
  notify: (text: string, kind: 'success' | 'error') => void
}

export default function MembersPanel({ data, run, notify }: Props) {
  const { hasPermission, session } = useAuth()
  const [keyword, setKeyword] = useState('')
  const [roleUserId, setRoleUserId] = useState<number | null>(null)
  const [roleDraft, setRoleDraft] = useState<number[]>([])
  const [editing, setEditing] = useState<AdminUser | 'create' | null>(null)
  const [form] = Form.useForm<MemberForm>()

  const roleUser = useMemo(
    () => data.users.find((u) => u.id === roleUserId) ?? null,
    [data.users, roleUserId],
  )

  const users = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return data.users
    return data.users.filter((row) => {
      const roles = parseIds(row.roleIds)
        .map((id) => data.roles.find((r) => r.id === id)?.name ?? '')
        .join(' ')
      return [row.name, row.email, row.phone, row.roleLabel, roles]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    })
  }, [data.roles, data.users, keyword])

  const canCreate = hasPermission(ADMIN.members.create)
  const canAssign = hasPermission(ADMIN.members.assignRole)
  const showActions = canCreate || canAssign
  const creating = editing === 'create'

  function openCreate() {
    form.resetFields()
    form.setFieldsValue({ roleIds: [] })
    setEditing('create')
  }

  function openEdit(row: AdminUser) {
    form.setFieldsValue({
      email: row.email,
      password: undefined,
      name: row.name,
      phone: row.phone ?? undefined,
      roleIds: parseIds(row.roleIds),
    })
    setEditing(row)
  }

  async function submit() {
    try {
      const values = await form.validateFields()
      if (!values.roleIds?.length) {
        notify('请至少选择一个角色', 'error')
        return
      }
      const payload = {
        email: values.email.trim(),
        name: values.name.trim(),
        phone: values.phone?.trim() || undefined,
        roleIds: values.roleIds,
      }
      if (creating) {
        await run(async () => {
          await createUser({ ...payload, password: values.password })
          setEditing(null)
        }, '成员已创建')
        return
      }
      if (editing && editing !== 'create') {
        const password = values.password?.trim()
        await run(async () => {
          await updateUser(editing.id, {
            ...payload,
            password: password || undefined,
          })
          setEditing(null)
        }, '成员已更新')
      }
    } catch {
      /* 校验 */
    }
  }

  return (
    <>
      <article className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>租户成员</h2>
          <div className={styles.inlineForm} style={{ marginBottom: 0 }}>
            <input
              placeholder="搜索姓名 / 账号 / 角色"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Can permission={ADMIN.members.create}>
              <button type="button" className={styles.btnPrimary} onClick={openCreate}>
                新建成员
              </button>
            </Can>
          </div>
        </div>
        <div className={styles.panelBody}>
          {users.length === 0 ? (
            <p className={styles.hint}>没有匹配的成员</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>成员</th>
                  <th>已授权角色</th>
                  <th>展示标签</th>
                  {showActions ? <th>操作</th> : null}
                </tr>
              </thead>
              <tbody>
                {users.map((row) => {
                  const ids = parseIds(row.roleIds)
                  const isSelf = session?.userId === row.id
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
                      {showActions ? (
                        <td>
                          {canCreate ? (
                            <button
                              type="button"
                              className={styles.btnLink}
                              onClick={() => openEdit(row)}
                            >
                              编辑
                            </button>
                          ) : null}
                          {canAssign ? (
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
                          ) : null}
                          {canCreate ? (
                            isSelf ? (
                              <button type="button" className={styles.btnDanger} disabled>
                                删除
                              </button>
                            ) : (
                              <Popconfirm
                                title="删除成员"
                                description={`确认删除「${row.name}」？此操作不可恢复。`}
                                okText="删除"
                                okButtonProps={{ danger: true }}
                                cancelText="取消"
                                onConfirm={() => run(() => deleteUser(row.id), '成员已删除')}
                              >
                                <button type="button" className={styles.btnDanger}>
                                  删除
                                </button>
                              </Popconfirm>
                            )
                          ) : null}
                        </td>
                      ) : null}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </article>

      <Modal
        title={creating ? '新建成员' : '编辑成员'}
        open={editing != null}
        onCancel={() => setEditing(null)}
        onOk={() => {
          void submit()
        }}
        okText={creating ? '创建' : '保存'}
        destroyOnClose
        width={480}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="email" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
            <Input placeholder="账号" />
          </Form.Item>
          <Form.Item
            name="password"
            label={creating ? '初始密码' : '新密码'}
            rules={
              creating
                ? [{ required: true, min: 6, message: '至少 6 位' }]
                : [
                    {
                      validator: async (_, value) => {
                        const text = String(value ?? '').trim()
                        if (!text || text.length >= 6) return
                        throw new Error('至少 6 位，留空则不修改')
                      },
                    },
                  ]
            }
          >
            <Input.Password
              autoComplete="new-password"
              placeholder={creating ? undefined : '不修改请留空'}
            />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机">
            <Input placeholder="可选" />
          </Form.Item>
          <Form.Item name="roleIds" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
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
