import type { AdminMenuItem, AdminPermission } from '@/api/admin'

export type PageGroup = {
  page: AdminPermission
  actions: AdminPermission[]
}

export type MatrixGroupNode = {
  type: 'group'
  key: string
  label: string
  icon?: string | null
  children: MatrixTreeNode[]
}

export type MatrixPageNode = {
  type: 'page'
  key: string
  group: PageGroup
}

export type MatrixUnplacedNode = {
  type: 'unplaced'
  key: string
  label: string
  children: MatrixPageNode[]
}

export type MatrixTreeNode = MatrixGroupNode | MatrixPageNode | MatrixUnplacedNode

export function bySort<T extends { id: number; sortOrder?: number | null }>(a: T, b: T) {
  return (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id
}

export function belongsToSubsystem(
  item: AdminMenuItem,
  menus: AdminMenuItem[],
  subsystem: string,
  seen: Set<number> = new Set(),
): boolean {
  if (item.app === subsystem) return true
  if (item.nodeType !== 'group') return false
  if (seen.has(item.id)) return false
  seen.add(item.id)
  return menus.some(
    (child) => child.parentId === item.id && belongsToSubsystem(child, menus, subsystem, seen),
  )
}

export function buildMatrixTree(
  subsystem: string,
  menus: AdminMenuItem[],
  groups: PageGroup[],
): MatrixTreeNode[] {
  const groupByCode = new Map(groups.map((g) => [g.page.code, g]))
  const filtered = menus.filter((item) => belongsToSubsystem(item, menus, subsystem)).sort(bySort)
  const filteredIds = new Set(filtered.map((m) => m.id))

  const childrenOf = (parentId: number | null) =>
    filtered.filter((m) => (m.parentId ?? null) === parentId).sort(bySort)

  const walkMenu = (item: AdminMenuItem): MatrixTreeNode | null => {
    if (item.nodeType === 'group') {
      const kids = childrenOf(item.id)
        .map((child) => walkMenu(child))
        .filter((n): n is MatrixTreeNode => n != null)
      if (!kids.length) return null
      return {
        type: 'group',
        key: `group-${item.id}`,
        label: item.label,
        icon: item.icon,
        children: kids,
      }
    }
    const code = item.permission
    if (!code) return null
    const group = groupByCode.get(code)
    if (!group) return null
    return { type: 'page', key: `page-${group.page.id}`, group }
  }

  const roots = childrenOf(null)
    .filter((item) => item.parentId == null || !filteredIds.has(item.parentId))
    .map((item) => walkMenu(item))
    .filter((n): n is MatrixTreeNode => n != null)

  const placedCodes = new Set(
    filtered.map((m) => m.permission).filter((code): code is string => Boolean(code)),
  )
  const unplaced = groups.filter((g) => !placedCodes.has(g.page.code)).sort((a, b) => bySort(a.page, b.page))
  if (unplaced.length) {
    roots.push({
      type: 'unplaced',
      key: `unplaced-${subsystem}`,
      label: '未挂侧栏',
      children: unplaced.map((group) => ({
        type: 'page',
        key: `page-${group.page.id}`,
        group,
      })),
    })
  }

  return roots
}

export function collectMatrixFolderKeys(nodes: MatrixTreeNode[]): string[] {
  const keys: string[] = []
  const walk = (list: MatrixTreeNode[]) => {
    for (const node of list) {
      if (node.type === 'group' || node.type === 'unplaced') {
        keys.push(node.key)
      }
      if (node.type !== 'page') {
        walk(node.children)
      }
    }
  }
  walk(nodes)
  return keys
}

/** 每个子系统树只展开第一个目录，其余默认折叠 */
export function defaultMatrixCollapsed(trees: MatrixTreeNode[][]): Record<string, boolean> {
  const collapsed: Record<string, boolean> = {}
  for (const tree of trees) {
    const folders = collectMatrixFolderKeys(tree)
    for (let i = 1; i < folders.length; i += 1) {
      collapsed[folders[i]] = true
    }
  }
  return collapsed
}

export function countMatrixPages(nodes: MatrixTreeNode[]): number {
  let n = 0
  const walk = (list: MatrixTreeNode[]) => {
    for (const node of list) {
      if (node.type === 'page') n += 1
      else walk(node.children)
    }
  }
  walk(nodes)
  return n
}

type Searchable = {
  pageLabel: (page: AdminPermission) => string
}

function pageMatches(group: PageGroup, q: string, pageLabel: (page: AdminPermission) => string) {
  const { page, actions } = group
  if (pageLabel(page).toLowerCase().includes(q)) return true
  if (page.code.toLowerCase().includes(q)) return true
  if (page.name.toLowerCase().includes(q)) return true
  return actions.some(
    (a) => a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q),
  )
}

export function filterMatrixTree(
  nodes: MatrixTreeNode[],
  keyword: string,
  searchable: Searchable,
): MatrixTreeNode[] {
  const q = keyword.trim().toLowerCase()
  if (!q) return nodes

  const walk = (list: MatrixTreeNode[]): MatrixTreeNode[] => {
    const out: MatrixTreeNode[] = []
    for (const node of list) {
      if (node.type === 'page') {
        if (pageMatches(node.group, q, searchable.pageLabel)) out.push(node)
        continue
      }
      const children = walk(node.children)
      if (children.length) {
        if (node.type === 'group') {
          out.push({ ...node, children })
        } else {
          out.push({ ...node, children: children as MatrixPageNode[] })
        }
      }
    }
    return out
  }

  return walk(nodes)
}
