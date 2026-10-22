import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { renderMenuIcon } from '@/config/menu-icons'
import { useMenus } from '@/context/MenuContext'
import type { MenuNode } from '@/types/menu'
import { pickActiveMenuKey } from '@/utils/menu-tree'
import { cx } from '@/utils/cx'
import styles from './index.module.scss'

export default function SideMenu() {
  const { layout, menus, loading, error } = useMenus()
  const location = useLocation()
  const activeKey = useMemo(
    () => pickActiveMenuKey(location.pathname, menus),
    [location.pathname, menus],
  )
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  const toggleGroup = (key: string) => {
    setOpenGroups((current) => ({ ...current, [key]: !current[key] }))
  }

  return (
    <nav className={styles.nav}>
      {loading ? <p className={styles.navState}>菜单加载中…</p> : null}
      {error ? <p className={styles.navState}>{error}</p> : null}
      {menus.map((item) => (
        <MenuEntry
          key={item.key}
          item={item}
          layout={layout}
          depth={0}
          activeKey={activeKey}
          openGroups={openGroups}
          onToggleGroup={toggleGroup}
        />
      ))}
    </nav>
  )
}

function MenuGlyph({
  icon,
  menuKey,
  app,
}: {
  icon?: string | null
  menuKey: string
  app?: string
}) {
  return (
    <span className={styles.menuIcon} aria-hidden>
      {renderMenuIcon(icon, menuKey, app)}
    </span>
  )
}

function MenuEntry({
  item,
  layout,
  depth,
  activeKey,
  openGroups,
  onToggleGroup,
}: {
  item: MenuNode
  layout: 'tree' | 'flat'
  depth: number
  activeKey: string | null
  openGroups: Record<string, boolean>
  onToggleGroup: (key: string) => void
}) {
  if (item.nodeType === 'group' && layout === 'tree') {
    const open = openGroups[item.key] ?? true
    return (
      <div className={cx(styles.menuGroup, depth > 0 && styles.menuGroupNested)}>
        <button
          type="button"
          className={styles.groupHead}
          onClick={() => onToggleGroup(item.key)}
          aria-expanded={open}
        >
          <MenuGlyph icon={item.icon} menuKey={item.key} app={item.app} />
          <span className={styles.groupLabel}>{item.label}</span>
          <i className={cx(styles.chevron, open && styles.chevronOpen)} />
        </button>
        {open ? (
          <div className={styles.groupBody}>
            {item.children?.map((child) => (
              <MenuEntry
                key={child.key}
                item={child}
                layout={layout}
                depth={depth + 1}
                activeKey={activeKey}
                openGroups={openGroups}
                onToggleGroup={onToggleGroup}
              />
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  if (item.nodeType === 'group') {
    return (
      <>
        {item.children?.map((child) => (
          <MenuEntry
            key={child.key}
            item={child}
            layout={layout}
            depth={depth}
            activeKey={activeKey}
            openGroups={openGroups}
            onToggleGroup={onToggleGroup}
          />
        ))}
      </>
    )
  }

  const isActive = activeKey === item.key

  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={cx(styles.item, depth > 0 && styles.itemNested, isActive && styles.active)}
      aria-current={isActive ? 'page' : undefined}
    >
      <MenuGlyph icon={item.icon} menuKey={item.key} app={item.app} />
      <span className={styles.itemLabel}>{item.label}</span>
    </NavLink>
  )
}
