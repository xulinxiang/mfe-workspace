import { apiRequest } from '@/api/client'
import type { AuthSession } from '@/utils/auth-storage'

export type LoginPayload = {
  email: string
  password: string
  tenantCode?: string
}

type LoginResult = Omit<AuthSession, 'roles' | 'permissions'>
type MeResult = Omit<AuthSession, 'token'>

export async function login(payload: LoginPayload): Promise<AuthSession> {
  const data = await apiRequest<LoginResult>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    null,
  )
  const me = await apiRequest<MeResult>('/api/auth/me', {}, { ...data, roles: [], permissions: [] })

  return {
    ...data,
    ...me,
    token: data.token,
  }
}

export function fetchMe() {
  return apiRequest<MeResult>('/api/auth/me')
}
