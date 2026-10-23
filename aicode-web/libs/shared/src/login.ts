import { apiRequest } from './api'
import { writeAuthSession, type AuthSession } from './auth'

export type LoginPayload = {
  email: string
  password: string
  tenantCode?: string
}

type LoginResult = Pick<
  AuthSession,
  'token' | 'tenantId' | 'tenantName' | 'tenantCode' | 'userId' | 'email' | 'name'
>

type MeResult = Omit<AuthSession, 'token'>

export async function loginWithPassword(payload: LoginPayload): Promise<AuthSession> {
  const data = await apiRequest<LoginResult>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    null,
  )
  const stub: AuthSession = {
    ...data,
    roles: [],
    permissions: [],
  }
  const me = await apiRequest<MeResult>('/api/auth/me', {}, stub)
  const session: AuthSession = {
    ...data,
    ...me,
    token: data.token,
  }
  writeAuthSession(session)
  return session
}
