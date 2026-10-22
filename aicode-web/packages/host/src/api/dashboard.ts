import { apiRequest } from '@/api/client'

export type DashboardStats = {
  remotes: number
  orders: number
  pending: number
  users: string
}

export function fetchDashboardStats() {
  return apiRequest<DashboardStats>('/api/dashboard/stats')
}
