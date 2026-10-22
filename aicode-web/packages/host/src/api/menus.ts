import { apiRequest } from '@/api/client'
import type { MenusView } from '@/types/menu'

export function fetchMenus() {
  return apiRequest<MenusView>('/api/menus')
}
