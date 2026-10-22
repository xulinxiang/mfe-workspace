export type AppName = 'host' | 'product' | 'user'

export type MenuLayout = 'tree' | 'flat'

export type MenuNode = {
  id?: number
  key: string
  label: string
  path: string
  app?: AppName | string
  /** Ant Design Icons 组件名，如 SettingOutlined */
  icon?: string | null
  permission?: string | null
  nodeType?: 'route' | 'group'
  parentId?: number | null
  routeCatalogId?: number | null
  sortOrder?: number
  children?: MenuNode[]
}

export type MenusView = {
  layout: MenuLayout
  items: MenuNode[]
}

/** @deprecated use MenuNode for routes */
export type MenuItem = MenuNode
