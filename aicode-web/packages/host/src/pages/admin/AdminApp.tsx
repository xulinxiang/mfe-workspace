import { AppProProvider } from '@aicode/pro-ui'
import type { ReactNode } from 'react'

export default function AdminApp({ children }: { children: ReactNode }) {
  return <AppProProvider>{children}</AppProProvider>
}
