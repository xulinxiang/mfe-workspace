import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchMe, login as loginApi, type LoginPayload } from '@/api/auth'
import { UNAUTHORIZED_EVENT } from '@aicode/shared/auth'
import {
  clearAuthSession,
  readAuthSession,
  writeAuthSession,
  type AuthSession,
} from '@/utils/auth-storage'

type AuthContextValue = {
  session: AuthSession | null
  initializing: boolean
  hasPermission: (permission: string) => boolean
  refreshSession: () => Promise<void>
  login: (payload: LoginPayload) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    readAuthSession(),
  )
  const [initializing, setInitializing] = useState(Boolean(session))

  useEffect(() => {
    const onUnauthorized = () => setSession(null)
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  useEffect(() => {
    if (!session) {
      setInitializing(false)
      return
    }
    fetchMe()
      .then((me) => {
        const next = { ...session, ...me, token: session.token }
        writeAuthSession(next)
        setSession(next)
      })
      .catch(() => {
        clearAuthSession()
        setSession(null)
      })
      .finally(() => setInitializing(false))
    // Session hydration only runs when the provider mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    const next = await loginApi(payload)
    writeAuthSession(next)
    setSession(next)
  }, [])

  const refreshSession = useCallback(async () => {
    if (!session) return
    const me = await fetchMe()
    const next = { ...session, ...me, token: session.token }
    writeAuthSession(next)
    setSession(next)
  }, [session])

  const logout = useCallback(() => {
    clearAuthSession()
    setSession(null)
  }, [])

  const hasPermission = useCallback(
    (permission: string) => Boolean(session?.permissions.includes(permission)),
    [session],
  )

  const value = useMemo(
    () => ({
      session,
      initializing,
      hasPermission,
      refreshSession,
      login,
      logout,
    }),
    [session, initializing, hasPermission, refreshSession, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
