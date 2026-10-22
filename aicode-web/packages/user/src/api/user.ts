import { apiRequest } from '@aicode/shared/api'
import type { UserAccount, UserAccountPayload, UserProfile } from '@/types/user'

export function getUserProfile() {
  return apiRequest<UserProfile>('/api/user/profile')
}

export function updateUserProfile(payload: Pick<UserProfile, 'name' | 'phone'>) {
  return apiRequest<UserProfile>('/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function getUserAccounts() {
  return apiRequest<UserAccount[]>('/api/user/accounts')
}

export function createUserAccount(payload: UserAccountPayload & { password: string }) {
  return apiRequest<UserAccount>('/api/user/accounts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateUserAccount(id: number, payload: UserAccountPayload) {
  return apiRequest<UserAccount>(`/api/user/accounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteUserAccount(id: number) {
  return apiRequest<null>(`/api/user/accounts/${id}`, { method: 'DELETE' })
}
