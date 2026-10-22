import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchMenus } from '@/api/menus'
import { useAuth } from '@/context/AuthContext'
import type { MenuLayout, MenuNode } from '@/types/menu'

function normalizeMenuTree(nodes: MenuNode[]): MenuNode[] {
  return nodes.map((node) => ({
    ...node,
    nodeType:
      node.nodeType ??
      (node.path === '#' || (node.children?.length && !node.path) ? 'group' : 'route'),
    children: node.children?.length ? normalizeMenuTree(node.children) : undefined,
  }))
}
import { titleFromMenuTree } from '@/utils/menu-tree'

type MenuContextValue = {
  layout: MenuLayout
  menus: MenuNode[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  titleForPath: (path: string) => string
}

const MenuContext = createContext<MenuContextValue | null>(null)

export function MenuProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [layout, setLayout] = useState<MenuLayout>('tree')
  const [menus, setMenus] = useState<MenuNode[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!session) {
      setMenus([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const view = await fetchMenus()
      setLayout(view.layout === 'flat' ? 'flat' : 'tree')
      setMenus(normalizeMenuTree(view.items ?? []))
    } catch (err) {
      setError(err instanceof Error ? err.message : '菜单加载失败')
    } finally {
      setLoading(false)
    }
  }, [session?.userId, session?.tenantId])

  useEffect(() => {
    reload()
  }, [reload])

  const value = useMemo<MenuContextValue>(
    () => ({
      layout,
      menus,
      loading,
      error,
      reload,
      titleForPath: (path) => titleFromMenuTree(path, menus),
    }),
    [layout, menus, loading, error, reload],
  )

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>
}

export function useMenus() {
  const ctx = useContext(MenuContext)
  if (!ctx) throw new Error('useMenus must be used within MenuProvider')
  return ctx
}
