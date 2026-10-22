import { fetchAdminBootstrap, type AdminBootstrap } from '@/api/admin'
import { App } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useMenus } from '@/context/MenuContext'

export function useAdminWorkspace() {
  const { message: toast } = App.useApp()
  const { refreshSession } = useAuth()
  const { reload: reloadMenus } = useMenus()
  const [data, setData] = useState<AdminBootstrap | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setData(await fetchAdminBootstrap())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  function notify(text: string, kind: 'success' | 'error') {
    if (kind === 'error') toast.error(text)
    else toast.success(text)
  }

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action()
      toast.success(success)
      await refreshSession()
      await reloadMenus()
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败')
    }
  }

  return { data, setData, loading, load, notify, run }
}
