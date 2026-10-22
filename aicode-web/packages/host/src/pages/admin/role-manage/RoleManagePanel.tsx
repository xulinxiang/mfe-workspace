import {
  createRole,
  deleteRole,
  parseIds,
  updateRole,
  type AdminBootstrap,
  type AdminRole,
  type RolePayload,
} from '@/api/admin'
import Can from '@/components/Can'
import { ADMIN } from '@/config/admin-permissions'
import { useAuth } from '@/context/AuthContext'
import { Form, Input, Modal, Popconfirm } from 'antd'
import { useMemo, useState } from 'react'
import styles from '../admin.module.scss'

type Props = {
  data: AdminBootstrap
  run: (action: () => Promise<unknown>, success: string) => Promise<void>
}

export default function RoleManagePanel({ data, run }: Props) {
  const { hasPermission } = useAuth()
  const canUpdate = hasPermission(ADMIN.roleManage.update)
  const canDelete = hasPermission(ADMIN.roleManage.delete)
  const [keyword, setKeyword] = useState('')
  const [editing, setEditing] = useState<AdminRole | 'create' | null>(null)
  const [form] = Form.useForm<RolePayload>()

  const roles = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return data.roles
    return data.roles.filter(
      (role) => role.name.toLowerCase().includes(q) || role.code.toLowerCase().includes(q),
    )
  }, [data.roles, keyword])

  const showActions = canUpdate || canDelete

  function openCreate() {
    form.resetFields()
    form.setFieldsValue({ code: '', name: '' })
    setEditing('create')
  }

  function openEdit(role: AdminRole) {
    form.setFieldsValue({ code: role.code, name: role.name })
    setEditing(role)
  }

  async function submit() {
    let values: RolePayload
    try {
      values = await form.validateFields()
    } catch {
      return
    }
    const payload: RolePayload = {
      code: values.code.trim(),
      name: values.name.trim(),
    }
    if (editing === 'create') {
      await run(async () => {
        await createRole(payload)
        setEditing(null)
      }, '角色已创建')
      return
    }
    if (editing && editing !== 'create') {
      await run(async () => {
        await updateRole(editing.id, payload)
        setEditing(null)
      }, '角色已更新')
    }
  }

  return (
    <>
      <article className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>角色列表</h2>
          <div className={styles.inlineForm} style={{ marginBottom: 0 }}>
            <input
              placeholder="搜索编码 / 名称"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Can permission={ADMIN.roleManage.create}>
              <button type="button" className={styles.btnPrimary} onClick={openCreate}>
                新建角色
              </button>
            </Can>
          </div>
        </div>
        <div className={styles.panelBody}>
          {roles.length === 0 ? (
            <p className={styles.hint}>没有匹配的角色</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>名称</th>
                  <th>编码</th>
                  <th>已配权限</th>
                  {showActions ? <th>操作</th> : null}
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td>
                      <strong>{role.name}</strong>
                    </td>
                    <td>
                      <code className={styles.permCode}>{role.code}</code>
                    </td>
                    <td>
                      <span className={`${styles.tag} ${styles.tagMuted}`}>
                        {parseIds(role.permissionIds).length} 项
                      </span>
                    </td>
                    {showActions ? (
                      <td>
                        {canUpdate ? (
                          <button
                            type="button"
                            className={styles.btnLink}
                            onClick={() => openEdit(role)}
                          >
                            编辑
                          </button>
                        ) : null}
                        {canDelete ? (
                          <Popconfirm
                            title="删除角色"
                            description={`确认删除「${role.name}」？仍被成员使用时无法删除。`}
                            okText="删除"
                            okButtonProps={{ danger: true }}
                            cancelText="取消"
                            onConfirm={() => run(() => deleteRole(role.id), '角色已删除')}
                          >
                            <button type="button" className={styles.btnDanger}>
                              删除
                            </button>
                          </Popconfirm>
                        ) : null}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </article>

      <Modal
        title={editing === 'create' ? '新建角色' : '编辑角色'}
        open={editing != null}
        onCancel={() => setEditing(null)}
        onOk={() => {
          void submit()
        }}
        okText={editing === 'create' ? '创建' : '保存'}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="编码"
            rules={[{ required: true, message: '请输入角色编码' }]}
          >
            <Input placeholder="如 operator" disabled={editing !== 'create' && !canUpdate} />
          </Form.Item>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="如 运营人员" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
