import { hasPermission } from '@aicode/shared/auth'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  createUserAccount,
  deleteUserAccount,
  getUserAccounts,
  updateUserAccount,
} from '@/api/user'
import { Form, Input } from 'antd'
import FormModal from '@/components/FormModal'
import { USER } from '@/permissions'
import type { UserAccount } from '@/types/user'
import styles from '@/styles/page.module.scss'

type Draft = {
  name: string
  email: string
  phone: string
  password: string
}

const emptyDraft: Draft = { name: '', email: '', phone: '', password: '' }

export default function UserList() {
  const [keyword, setKeyword] = useState('')
  const [users, setUsers] = useState<UserAccount[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editing, setEditing] = useState<UserAccount | 'create' | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const canCreate = hasPermission(USER.create)
  const canUpdate = hasPermission(USER.update)
  const canDelete = hasPermission(USER.delete)
  const creating = editing === 'create'

  function load() {
    getUserAccounts()
      .then(setUsers)
      .catch((err: Error) => setLoadError(err.message || '用户加载失败'))
  }

  useEffect(() => {
    load()
  }, [])

  const list = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return users
    return users.filter((row) =>
      [row.name, row.email, row.phone, row.roleLabel]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    )
  }, [keyword, users])

  function closeModal() {
    if (submitting) return
    setEditing(null)
    setFormError(null)
  }

  function openCreate() {
    setDraft(emptyDraft)
    setFormError(null)
    setEditing('create')
  }

  function openEdit(row: UserAccount) {
    setDraft({
      name: row.name,
      email: row.email,
      phone: row.phone ?? '',
      password: '',
    })
    setFormError(null)
    setEditing(row)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!draft.name.trim() || !draft.email.trim()) {
      setFormError('请填写姓名和邮箱')
      return
    }
    if (creating && draft.password.length < 6) {
      setFormError('初始密码至少 6 位')
      return
    }
    setSubmitting(true)
    setFormError(null)
    try {
      if (editing === 'create') {
        await createUserAccount({
          name: draft.name,
          email: draft.email,
          phone: draft.phone || undefined,
          password: draft.password,
        })
      } else if (editing) {
        await updateUserAccount(editing.id, {
          name: draft.name,
          email: draft.email,
          phone: draft.phone || undefined,
          password: draft.password || undefined,
        })
      }
      setEditing(null)
      load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete(row: UserAccount) {
    if (!window.confirm(`确定删除用户「${row.name}」？`)) return
    try {
      await deleteUserAccount(row.id)
      load()
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : '删除失败')
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1>用户列表</h1>
        </div>
      </div>

      <article className={`${styles.card} ${styles.panel}`}>
        <div className={styles.panelHead}>
          <h2>用户账号</h2>
          <div className={styles.panelTools}>
            <label className={styles.searchInline}>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索姓名 / 邮箱 / 角色"
              />
            </label>
            <span className={styles.meta}>共 {list.length} 人</span>
            {canCreate ? (
              <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={openCreate}>
                新建用户
              </button>
            ) : null}
          </div>
        </div>
        <div className={styles.panelBody}>
          {loadError ? <p className={styles.bannerError}>{loadError}</p> : null}
          {list.length === 0 && !loadError ? (
            <p className={styles.empty}>暂无用户</p>
          ) : (
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>用户</th>
                  <th>邮箱</th>
                  <th>手机</th>
                  <th className={styles.colNarrow}>角色</th>
                  {canUpdate || canDelete ? (
                    <th className={styles.colActions}>操作</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className={styles.nameCell}>
                        <span className={styles.thumb}>{row.name.slice(0, 1)}</span>
                        <strong>{row.name}</strong>
                      </div>
                    </td>
                    <td className={styles.mono}>{row.email}</td>
                    <td>{row.phone || '—'}</td>
                    <td className={styles.colNarrow}>{row.roleLabel || '—'}</td>
                    {canUpdate || canDelete ? (
                      <td className={styles.colActions}>
                        <div className={styles.rowActions}>
                          {canUpdate ? (
                            <button type="button" className={styles.linkBtn} onClick={() => openEdit(row)}>
                              编辑
                            </button>
                          ) : null}
                          {canUpdate && canDelete ? <span className={styles.actionSep} /> : null}
                          {canDelete ? (
                            <button
                              type="button"
                              className={`${styles.linkBtn} ${styles.linkDanger}`}
                              onClick={() => onDelete(row)}
                            >
                              删除
                            </button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </article>

      <FormModal
        key={editing === 'create' ? 'create' : editing?.id ?? 'closed'}
        open={editing != null}
        title={creating ? '新建用户' : `编辑用户 · ${editing && editing !== 'create' ? editing.name : ''}`}
        onClose={closeModal}
        onSubmit={onSubmit}
        submitting={submitting}
        submitLabel={creating ? '创建' : '保存'}
        error={formError}
      >
        <div className={`ant-form ant-form-vertical ${styles.modalFormBody}`}>
          <Form layout="vertical" component={false} colon={false} requiredMark labelAlign="left">
          <Form.Item label="姓名" required>
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              autoFocus
            />
          </Form.Item>
          <Form.Item label="邮箱" required>
            <Input
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              autoComplete={creating ? 'email' : 'off'}
            />
          </Form.Item>
          <Form.Item label="手机号">
            <Input
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              placeholder="可选"
            />
          </Form.Item>
          <Form.Item label={creating ? '初始密码' : '新密码'} required={creating}>
            <Input.Password
              value={draft.password}
              onChange={(e) => setDraft({ ...draft, password: e.target.value })}
              autoComplete="new-password"
              readOnly={!creating}
              onFocus={(e) => {
                if (!creating) e.currentTarget.removeAttribute('readOnly')
              }}
              placeholder={creating ? '至少 6 位' : '不修改请留空'}
            />
          </Form.Item>
          </Form>
        </div>
      </FormModal>
    </section>
  )
}
