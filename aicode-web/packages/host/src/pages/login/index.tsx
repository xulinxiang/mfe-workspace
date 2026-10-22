import { FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import styles from './index.module.scss'

export default function LoginPage() {
  const { session, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: string } | null)?.from?.startsWith('/login')
      ? '/'
      : (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('demo@company.com')
  const [password, setPassword] = useState('demo123')
  const [tenantCode, setTenantCode] = useState('demo')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (session) {
    return <Navigate to={from} replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login({ tenantCode: tenantCode.trim(), email: email.trim(), password })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '登录失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.mark}>运</span>
          <div>
            <h1>运营中台登录</h1>
            <p>Aicode · 多租户演示环境</p>
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <div className={styles.field}>
            <label htmlFor="tenantCode">租户编码</label>
            <input
              id="tenantCode"
              value={tenantCode}
              onChange={(e) => setTenantCode(e.target.value)}
              autoComplete="organization"
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="email">邮箱</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">密码</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? <p className={styles.error}>{error}</p> : null}

          <button className={styles.submit} type="submit" disabled={submitting}>
            {submitting ? '登录中…' : '登录'}
          </button>
        </form>

        <p className={styles.hint}>
          演示账号：<code>demo@company.com</code> / <code>demo123</code>
        </p>
      </div>
    </div>
  )
}
