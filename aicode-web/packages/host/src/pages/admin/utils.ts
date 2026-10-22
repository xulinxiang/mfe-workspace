import type { MenuNode } from '@/types/menu'

export function countMenuNodes(nodes: MenuNode[]): number {
  let n = 0
  const walk = (list: MenuNode[]) => {
    for (const node of list) {
      n += 1
      if (node.children?.length) walk(node.children)
    }
  }
  walk(nodes)
  return n
}
