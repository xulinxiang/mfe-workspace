import {
  AppstoreOutlined,
  BarChartOutlined,
  CloudOutlined,
  DatabaseOutlined,
  FolderOutlined,
  HomeOutlined,
  KeyOutlined,
  MenuOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  SolutionOutlined,
  ShopOutlined,
  TagsOutlined,
  TeamOutlined,
  ToolOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { ComponentType, ReactNode } from 'react'

/** 侧栏可选图标（Ant Design Icons 组件名）— UI 用图标预览，不展示文字名 */
export const MENU_ICON_OPTIONS: { value: string; label: string }[] = [
  { value: 'AppstoreOutlined', label: '应用' },
  { value: 'HomeOutlined', label: '首页' },
  { value: 'UnorderedListOutlined', label: '列表' },
  { value: 'TagsOutlined', label: '标签' },
  { value: 'PlusOutlined', label: '新建' },
  { value: 'ShopOutlined', label: '商品' },
  { value: 'UserOutlined', label: '用户' },
  { value: 'TeamOutlined', label: '团队' },
  { value: 'SettingOutlined', label: '设置' },
  { value: 'FolderOutlined', label: '分组' },
  { value: 'ToolOutlined', label: '工具' },
  { value: 'BarChartOutlined', label: '统计' },
  { value: 'DatabaseOutlined', label: '数据' },
  { value: 'CloudOutlined', label: '云' },
  { value: 'KeyOutlined', label: '权限' },
  { value: 'SafetyCertificateOutlined', label: '安全' },
  { value: 'SolutionOutlined', label: '角色' },
]

const ICON_BY_NAME: Record<string, ComponentType> = {
  AppstoreOutlined,
  HomeOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
  UnorderedListOutlined,
  TagsOutlined,
  PlusOutlined,
  ShopOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  FolderOutlined,
  ToolOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  CloudOutlined,
  MenuOutlined,
}

const BY_KEY: Record<string, ReactNode> = {
  dashboard: <AppstoreOutlined />,
  'group-product-hub': <FolderOutlined />,
  'product-list': <UnorderedListOutlined />,
  'product-category': <TagsOutlined />,
  'product-detail': <ShopOutlined />,
  'group-user-hub': <TeamOutlined />,
  'user-list': <TeamOutlined />,
  'user-profile': <UserOutlined />,
  'user-center': <UserOutlined />,
  'group-tenant-admin': <SettingOutlined />,
  'admin-members': <TeamOutlined />,
  'admin-members-list': <TeamOutlined />,
  'admin-role-manage': <SolutionOutlined />,
  'admin-roles': <SafetyCertificateOutlined />,
  'admin-permissions': <KeyOutlined />,
  'admin-permissions-view': <KeyOutlined />,
}

const BY_APP: Record<string, ReactNode> = {
  host: <AppstoreOutlined />,
  product: <ShopOutlined />,
  user: <UserOutlined />,
}

export function getMenuIcon(key: string, app?: string): ReactNode {
  return BY_KEY[key] ?? (app ? BY_APP[app] : null) ?? <AppstoreOutlined />
}

/** API 返回的 icon 字段优先，否则按 key / app 兜底 */
export function renderMenuIcon(
  iconName?: string | null,
  key?: string,
  app?: string,
): ReactNode {
  if (iconName) {
    const Icon = ICON_BY_NAME[iconName]
    if (Icon) return <Icon />
  }
  return getMenuIcon(key ?? '', app)
}

export const subsystemIcons = {
  host: <AppstoreOutlined />,
  product: <ShopOutlined />,
  user: <TeamOutlined />,
} as const
