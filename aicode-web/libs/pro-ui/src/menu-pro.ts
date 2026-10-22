import type { MenuDataItem } from '@ant-design/pro-components'

export type ProMenuSource = {
  key: string
  label: string
  path: string
  app?: string
  nodeType?: 'route' | 'group'
  children?: ProMenuSource[]
}

export function toProLayoutMenus(nodes: ProMenuSource[]): MenuDataItem[] {
  return nodes
    .map((node) => {
      if (node.nodeType === 'group') {
        const children = toProLayoutMenus(node.children ?? [])
        if (!children.length) return null
        return {
          key: node.key,
          name: node.label,
          children,
        } satisfies MenuDataItem
      }
      if (!node.path || node.path === '#') return null
      return {
        key: node.key,
        name: node.label,
        path: node.path,
      } satisfies MenuDataItem
    })
    .filter(Boolean) as MenuDataItem[]
}
