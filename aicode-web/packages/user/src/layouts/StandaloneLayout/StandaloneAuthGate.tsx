import { loginWithPassword } from '@aicode/shared/login'
import {
  readAuthSession,
  UNAUTHORIZED_EVENT,
  type AuthSession,
} from '@aicode/shared/auth'
import { Alert, Button } from 'antd'
import { useEffect, useState, type ReactNode } from 'react'
import styles from './standalone-auth.module.scss'

const HOST_DEV_URL = import.meta.env.VITE_HOST_ORIGIN ?? 'http://localhost:5000'
const STANDALONE_PORT = '5002'

type Props = {
  children: ReactNode
}

export function useStandaloneSession() {
  const [session, setSession] = useState<AuthSession | null>(() => readAuthSession())

  useEffect(() => {
    const sync = () => setSession(readAuthSession())
    window.addEventListener(UNAUTHORIZED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return { session, refresh: () => setSession(readAuthSession()) }
}

export default function StandaloneAuthGate({ children }: Props) {
  const { session, refresh } = useStandaloneSession()
  const [loggingIn, setLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  async function demoLogin() {
    setLoggingIn(true)
    setLoginError(null)
    try {
      await loginWithPassword({
        email: 'demo@company.com',
        password: 'demo123',
      })
      refresh()
      window.location.reload()
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoggingIn(false)
    }
  }

  return (
    <>
      {!session ? (
        <Alert
          type="warning"
          showIcon
          className={styles.banner}
          message="这是 remote 开发预览，不是打开子系统的入口"
          description={
            <div className={styles.bannerBody}>
              <p>
                联调 / 演示请用 <strong>Host :5000</strong> 登录后点侧栏「用户列表」——登录与路由都在主站。
                直接打开 <code>:{STANDALONE_PORT}</code> 仅用于本地改 UI，且与 :5000 <strong>不共享</strong> 登录态。
              </p>
              <div className={styles.actions}>
                <Button type="primary" href={`${HOST_DEV_URL}/user`}>
                  去主站打开用户子系统
                </Button>
                <Button loading={loggingIn} onClick={() => void demoLogin()}>
                  仅本端口 Demo 登录（调 UI 用）
                </Button>
              </div>
              {loginError ? <p className={styles.error}>{loginError}</p> : null}
            </div>
          }
        />
      ) : null}
      {children}
    </>
  )
}
