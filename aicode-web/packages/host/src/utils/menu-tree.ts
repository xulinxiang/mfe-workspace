import type { MenuNode } from '@/types/menu'

export function flattenMenuRoutes(nodes: MenuNode[]): MenuNode[] {
  const flat: MenuNode[] = []
  const walk = (list: MenuNode[]) => {
    for (const node of list) {
      if (node.nodeType === 'group') {
        walk(node.children ?? [])
      } else {
        flat.push(node)
      }
    }
  }
  walk(nodes)
  return flat
}

export function collectMenuKeys(nodes: MenuNode[]): Set<string> {
  const keys = new Set<string>()
  const walk = (list: MenuNode[]) => {
    for (const node of list) {
      keys.add(node.key)
      if (node.children?.length) walk(node.children)
    }
  }
  walk(nodes)
  return keys
}

function pathMatchesMenuRoute(pathname: string, menuPath: string): boolean {
  if (menuPath === '#' || !menuPath) return false
  if (menuPath === '/') return pathname === '/'
  const pattern = menuPath.replace(/:[^/]+/g, '[^/]+').replace(/\//g, '\\/')
  const re = new RegExp(`^${pattern}(?:/|$)`)
  return re.test(pathname)
}

/** 同一 URL 只高亮一条菜单（最长路径优先；路径相同则 sortOrder 更小者优先） */
export function pickActiveMenuKey(pathname: string, nodes: MenuNode[]): string | null {
  const routes = flattenMenuRoutes(nodes)
  const candidates = routes.filter((item) => pathMatchesMenuRoute(pathname, item.path))
  if (!candidates.length) return null
  candidates.sort((a, b) => {
    const len = b.path.length - a.path.length
    if (len !== 0) return len
    return (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999)
  })
  const bestLen = candidates[0].path.length
  const tied = candidates.filter((item) => item.path.length === bestLen)
  tied.sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999))
  return tied[0].key
}

export function titleFromMenuTree(path: string, nodes: MenuNode[]): string {
  const routes = flattenMenuRoutes(nodes)
  const exact = routes.find((item) => item.path === path)
  if (exact) return exact.label
  const nested = routes
    .filter(
      (item) =>
        item.path !== '/' &&
        item.path !== '#' &&
        (path === item.path || path.startsWith(`${item.path}/`)),
    )
    .sort((a, b) => b.path.length - a.path.length)[0]
  return nested?.label ?? '页面'
}
