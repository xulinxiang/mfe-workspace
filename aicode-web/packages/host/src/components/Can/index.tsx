import type { ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'

type Props = {
  permission: string
  children: ReactNode
  fallback?: ReactNode
}

export default function Can({ permission, children, fallback = null }: Props) {
  const { hasPermission } = useAuth()
  return hasPermission(permission) ? children : fallback
}
