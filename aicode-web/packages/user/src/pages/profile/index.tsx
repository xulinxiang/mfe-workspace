import { hasPermission } from '@aicode/shared/auth'
import { useEffect, useState } from 'react'
import { getUserProfile, updateUserProfile } from '@/api/user'
import type { UserProfile } from '@/types/user'
import styles from './index.module.scss'

export default function Profile() {
  const [form, setForm] = useState<UserProfile | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const canUpdate = hasPermission('user:profile:update')

  useEffect(() => {
    getUserProfile()
      .then(setForm)
      .catch((err: Error) => setMessage(err.message || '资料加载失败'))
  }, [])

  async function save() {
    if (!form) return
    setMessage(null)
    try {
      const next = await updateUserProfile({
        name: form.name,
        phone: form.phone,
      })
      setForm(next)
      setMessage('保存成功')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '保存失败')
    }
  }

  if (!form) {
    return <section className={styles.page}>{message ?? '正在加载真实用户资料…'}</section>
  }

  return (
    <section className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1>用户中心</h1>
          <p>子应用 user_app · 表单页示例</p>
        </div>
        {canUpdate ? (
          <button type="button" className={styles.btn} onClick={save}>
            保存修改
          </button>
        ) : null}
      </div>

      <div className={styles.layout}>
        <aside className={`${styles.card} ${styles.profile}`}>
          <div className={styles.avatar}>
            {form.name.slice(0, 1).toUpperCase() || '?'}
          </div>
          <strong>{form.name || '未命名'}</strong>
          <p>{form.email}</p>
          <span className={styles.role}>{form.role}</span>
        </aside>

        <div className={`${styles.card} ${styles.form}`}>
          <h3>基本信息</h3>
          <div className={styles.grid}>
            <label>
              <span>显示名称</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              <span>邮箱</span>
              <input
                value={form.email}
                readOnly
              />
            </label>
            <label>
              <span>角色</span>
              <input value={form.role} readOnly />
            </label>
            <label>
              <span>手机号</span>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
          </div>
          <p className={styles.hint}>
            {message ??
              (canUpdate
                ? '名称和手机号可保存到真实用户表。'
                : '当前角色仅可查看资料。')}
          </p>
        </div>
      </div>
    </section>
  )
}
