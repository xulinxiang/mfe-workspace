import { apiRequest } from '@aicode/shared/api'
import type { UserProfile } from '@/types/user'

export function getUserProfile() {
  return apiRequest<UserProfile>('/api/user/profile')
}

export function updateUserProfile(payload: Pick<UserProfile, 'name' | 'phone'>) {
  return apiRequest<UserProfile>('/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
