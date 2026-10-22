export const AUTH_STORAGE_KEY = 'aicode_auth'
export const UNAUTHORIZED_EVENT = 'aicode:unauthorized'

export type AuthSession = {
  token: string
  tenantId: number
  tenantName: string
  tenantCode: string
  userId: number
  email: string
  name: string
  roles: string[]
  permissions: string[]
}

export function readAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as Partial<AuthSession>
    if (!session.token || !session.tenantId) return null
    return {
      token: session.token,
      tenantId: session.tenantId,
      tenantName: session.tenantName ?? '',
      tenantCode: session.tenantCode ?? '',
      userId: session.userId ?? 0,
      email: session.email ?? '',
      name: session.name ?? '',
      roles: session.roles ?? [],
      permissions: session.permissions ?? [],
    }
  } catch {
    return null
  }
}

export function writeAuthSession(session: AuthSession) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function hasPermission(permission: string) {
  return Boolean(readAuthSession()?.permissions.includes(permission))
}

export function emitUnauthorized() {
  clearAuthSession()
  window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
}
