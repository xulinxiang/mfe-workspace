import {
  createMenu,
  createPermission,
  deleteMenu,
  deletePermission,
  reorderMenus,
  reorderPermissions,
  updateMenu,
  updatePermission,
  type AdminBootstrap,
  type AdminMenuItem,
  type AdminPermission,
} from '@/api/admin'
import Can from '@/components/Can'
import { ADMIN } from '@/config/admin-permissions'
import { MENU_ICON_OPTIONS, renderMenuIcon, subsystemIcons } from '@/config/menu-icons'
import { useAuth } from '@/context/AuthContext'
import { cx } from '@/utils/cx'
import { Form, Input, Modal, Select } from 'antd'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import styles from '../admin.module.scss'

type Props = {
  data: AdminBootstrap
  run: (action: () => Promise<unknown>, success: string) => Promise<void>
}

type CatalogNode = {
  key: string
  kind: 'group' | 'route' | 'action' | 'unplaced'
  title: string
  extra?: string
  icon?: string | null
  menu?: AdminMenuItem
  page?: AdminPermission
  action?: AdminPermission
  children: CatalogNode[]
  parentMenuId: number | null
  siblingMenuIds: number[]
  siblingActionIds: number[]
}

function bySort<T extends { id: number; sortOrder?: number | null }>(a: T, b: T) {
  return (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id
}

function IconPicker({
  value,
  onChange,
}: {
  value?: string | null
  onChange?: (next: string | null) => void
}) {
  return (
    <div className={styles.iconPicker} role="listbox" aria-label="选择图标">
      {MENU_ICON_OPTIONS.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="option"
            aria-selected={selected}
            title={opt.label}
            className={cx(styles.iconPick, selected && styles.iconPickActive)}
            onClick={() => onChange?.(selected ? null : opt.value)}
          >
            {renderMenuIcon(opt.value)}
          </button>
        )
      })}
    </div>
  )
}

function belongsToSubsystem(
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
    (child) =>
      child.parentId === item.id && belongsToSubsystem(child, menus, subsystem, seen),
  )
}

export default function PermissionsPanel({ data, run }: Props) {
  const { hasPermission } = useAuth()
  const canCreate = hasPermission(ADMIN.permissions.create)
  const canUpdate = hasPermission(ADMIN.permissions.update)
  const canDelete = hasPermission(ADMIN.permissions.delete)
  const [searchParams, setSearchParams] = useSearchParams()
  const urlSub = searchParams.get('sub')
  const activeSubsystem = data.subsystems.some((s) => s.code === urlSub)
    ? (urlSub as string)
    : (data.subsystems[0]?.code ?? 'host')

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const [groupOpen, setGroupOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<AdminMenuItem | null>(null)
  const [groupParentId, setGroupParentId] = useState<number | null>(null)
  const [groupForm] = Form.useForm<{ label: string; icon?: string | null; parentId?: number | null }>()

  const [pageFormOpen, setPageFormOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<AdminPermission | null>(null)
  const [pageForm] = Form.useForm<{
    code: string
    name: string
    subsystem: string
    path: string
    icon?: string | null
    parentMenuId?: number | null
  }>()

  const [actionFormOpen, setActionFormOpen] = useState(false)
  const [editingAction, setEditingAction] = useState<AdminPermission | null>(null)
  const [actionParentCode, setActionParentCode] = useState<string | null>(null)
  const [actionForm] = Form.useForm<{ code: string; name: string }>()

  const menus = data.menus ?? []
  const catalogByPermission = useMemo(() => {
    const map = new Map<string, { path: string; icon?: string | null }>()
    for (const entry of data.routeCatalog) {
      map.set(entry.permission, { path: entry.path, icon: entry.icon })
    }
    return map
  }, [data.routeCatalog])

  const pages = useMemo(
    () => data.permissions.filter((p) => (p.resourceType ?? 'page') === 'page'),
    [data.permissions],
  )
  const actions = useMemo(
    () => data.permissions.filter((p) => p.resourceType === 'action').slice().sort(bySort),
    [data.permissions],
  )
  const pageByCode = useMemo(() => new Map(pages.map((p) => [p.code, p])), [pages])

  const filteredMenus = useMemo(
    () => menus.filter((item) => belongsToSubsystem(item, menus, activeSubsystem)).sort(bySort),
    [menus, activeSubsystem],
  )
  const filteredIds = useMemo(() => new Set(filteredMenus.map((m) => m.id)), [filteredMenus])

  const groupsInSubsystem = useMemo(
    () => filteredMenus.filter((m) => m.nodeType === 'group'),
    [filteredMenus],
  )

  const groupOptions = useMemo(
    () => [
      { value: 0, label: '侧栏根级（不放目录下）' },
      ...groupsInSubsystem.map((g) => ({ value: g.id, label: g.label })),
    ],
    [groupsInSubsystem],
  )

  const tree = useMemo(() => {
    const childrenOf = (parentId: number | null) =>
      filteredMenus.filter((m) => (m.parentId ?? null) === parentId).sort(bySort)

    const toNode = (item: AdminMenuItem, siblings: AdminMenuItem[]): CatalogNode => {
      const siblingMenuIds = siblings.map((s) => s.id)
      if (item.nodeType === 'group') {
        const kids = childrenOf(item.id)
        return {
          key: `menu-${item.id}`,
          kind: 'group',
          title: item.label,
          extra: item.menuKey,
          icon: item.icon,
          menu: item,
          children: kids.map((child) => toNode(child, kids)),
          parentMenuId: item.parentId ?? null,
          siblingMenuIds,
          siblingActionIds: [],
        }
      }
      const page = item.permission ? pageByCode.get(item.permission) : undefined
      const pageActions = actions.filter((a) => a.parentCode === item.permission)
      return {
        key: `menu-${item.id}`,
        kind: 'route',
        title: item.label,
        extra: [item.permission, item.path].filter(Boolean).join(' · '),
        icon: item.icon,
        menu: item,
        page,
        children: pageActions.map((action) => ({
          key: `action-${action.id}`,
          kind: 'action' as const,
          title: action.name,
          extra: action.code,
          action,
          children: [],
          parentMenuId: item.id,
          siblingMenuIds: [],
          siblingActionIds: pageActions.map((a) => a.id),
        })),
        parentMenuId: item.parentId ?? null,
        siblingMenuIds,
        siblingActionIds: [],
      }
    }

    const roots = filteredMenus
      .filter((item) => item.parentId == null || !filteredIds.has(item.parentId))
      .sort(bySort)
    const nodes = roots.map((item) => toNode(item, roots))

    const placedCodes = new Set(
      filteredMenus.map((m) => m.permission).filter(Boolean) as string[],
    )
    const unplaced = pages
      .filter((p) => (p.subsystem ?? '其他') === activeSubsystem && !placedCodes.has(p.code))
      .sort(bySort)
    if (unplaced.length) {
      nodes.push({
        key: 'unplaced-root',
        kind: 'unplaced',
        title: '未挂侧栏',
        extra: `${unplaced.length} 个页面`,
        children: unplaced.map((page) => {
          const catalog = catalogByPermission.get(page.code)
          return {
            key: `unplaced-${page.id}`,
            kind: 'unplaced' as const,
            title: page.name,
            extra: [page.code, catalog?.path].filter(Boolean).join(' · '),
            page,
            children: actions
              .filter((a) => a.parentCode === page.code)
              .map((action) => ({
                key: `action-${action.id}`,
                kind: 'action' as const,
                title: action.name,
                extra: action.code,
                action,
                children: [],
                parentMenuId: null,
                siblingMenuIds: [],
                siblingActionIds: actions
                  .filter((a) => a.parentCode === page.code)
                  .map((a) => a.id),
              })),
            parentMenuId: null,
            siblingMenuIds: [],
            siblingActionIds: [],
          }
        }),
        parentMenuId: null,
        siblingMenuIds: [],
        siblingActionIds: [],
      })
    }
    return nodes
  }, [filteredMenus, filteredIds, pageByCode, actions, pages, activeSubsystem, catalogByPermission])

  const selectedGroupId = useMemo(() => {
    if (!selectedKey?.startsWith('menu-')) return null
    const id = Number(selectedKey.slice(5))
    const item = filteredMenus.find((m) => m.id === id)
    return item?.nodeType === 'group' ? item.id : null
  }, [selectedKey, filteredMenus])

  const routeCount = filteredMenus.filter((m) => m.nodeType !== 'group').length

  function setSubsystem(code: string) {
    const next = new URLSearchParams(searchParams)
    next.set('sub', code)
    setSearchParams(next, { replace: true })
    setSelectedKey(null)
  }

  function toggle(key: string) {
    setCollapsed((map) => ({ ...map, [key]: !map[key] }))
  }

  function isOpen(key: string) {
    return !collapsed[key]
  }

  function confirm(title: string, onOk: () => void) {
    Modal.confirm({ title, okText: '删除', okButtonProps: { danger: true }, onOk })
  }

  function openCreateGroup(parentId: number | null) {
    setEditingGroup(null)
    setGroupParentId(parentId)
    groupForm.setFieldsValue({ label: '', icon: 'FolderOutlined', parentId: parentId ?? 0 })
    setGroupOpen(true)
  }

  function openEditGroup(item: AdminMenuItem) {
    setEditingGroup(item)
    setGroupParentId(item.parentId ?? null)
    groupForm.setFieldsValue({
      label: item.label,
      icon: item.icon ?? 'FolderOutlined',
      parentId: item.parentId ?? 0,
    })
    setGroupOpen(true)
  }

  async function submitGroup() {
    const values = await groupForm.validateFields()
    const parentId = values.parentId === 0 || values.parentId == null ? null : values.parentId
    const payload = {
      label: values.label.trim(),
      icon: values.icon ?? null,
      app: activeSubsystem,
      nodeType: 'group' as const,
      parentId,
    }
    await run(async () => {
      if (editingGroup) await updateMenu(editingGroup.id, { ...payload, key: editingGroup.menuKey })
      else await createMenu(payload)
      setGroupOpen(false)
    }, editingGroup ? '目录已更新' : '目录已创建')
  }

  function openCreatePage(parentId: number | null) {
    setEditingPage(null)
    pageForm.setFieldsValue({
      code: '',
      name: '',
      subsystem: activeSubsystem,
      path: '',
      icon: null,
      parentMenuId: parentId ?? 0,
    })
    setPageFormOpen(true)
  }

  function openEditPage(page: AdminPermission, menu?: AdminMenuItem) {
    setEditingPage(page)
    const catalog = catalogByPermission.get(page.code)
    const parentId = menu?.parentId ?? null
    pageForm.setFieldsValue({
      code: page.code,
      name: page.name,
      subsystem: page.subsystem ?? activeSubsystem,
      path: catalog?.path ?? menu?.path ?? '',
      icon: catalog?.icon ?? menu?.icon ?? null,
      parentMenuId: parentId ?? 0,
    })
    setPageFormOpen(true)
  }

  async function submitPage() {
    const values = await pageForm.validateFields()
    const parentMenuId =
      values.parentMenuId === 0 || values.parentMenuId == null ? null : values.parentMenuId
    const payload = {
      code: values.code.trim(),
      name: values.name.trim(),
      resourceType: 'page' as const,
      subsystem: values.subsystem,
      parentCode: null,
      path: values.path.trim(),
      icon: values.icon ?? null,
      parentMenuId,
    }
    await run(async () => {
      if (editingPage) await updatePermission(editingPage.id, payload)
      else await createPermission(payload)
      setPageFormOpen(false)
    }, editingPage ? '菜单已更新' : '菜单已创建')
  }

  function openCreateAction(parentCode: string) {
    setEditingAction(null)
    setActionParentCode(parentCode)
    actionForm.setFieldsValue({ code: `${parentCode}:`, name: '' })
    setActionFormOpen(true)
  }

  function openEditAction(action: AdminPermission) {
    setEditingAction(action)
    setActionParentCode(action.parentCode ?? null)
    actionForm.setFieldsValue({ code: action.code, name: action.name })
    setActionFormOpen(true)
  }

  async function submitAction() {
    if (!actionParentCode) return
    const values = await actionForm.validateFields()
    const payload = {
      code: values.code.trim(),
      name: values.name.trim(),
      resourceType: 'action' as const,
      parentCode: actionParentCode,
      subsystem: activeSubsystem,
    }
    await run(async () => {
      if (editingAction) await updatePermission(editingAction.id, payload)
      else await createPermission(payload)
      setActionFormOpen(false)
    }, editingAction ? '按钮权限已更新' : '按钮权限已创建')
  }

  async function attachPage(page: AdminPermission, parentId: number | null) {
    const catalog = catalogByPermission.get(page.code)
    if (!catalog?.path) {
      Modal.error({ title: '无法挂到侧栏', content: '该页面还没有路由 path，请先编辑并填写 path。' })
      return
    }
    await run(
      () =>
        createMenu({
          key: page.code.replace(/:/g, '-'),
          label: page.name,
          path: catalog.path,
          app: activeSubsystem,
          permission: page.code,
          icon: catalog.icon ?? null,
          nodeType: 'route',
          parentId,
        }),
      '已挂到侧栏',
    )
  }

  async function moveMenus(ids: number[], parentId: number | null, currentId: number, dir: -1 | 1) {
    const i = ids.indexOf(currentId)
    const j = i + dir
    if (i < 0 || j < 0 || j >= ids.length) return
    const next = ids.slice()
    const tmp = next[i]
    next[i] = next[j]
    next[j] = tmp
    await run(() => reorderMenus(parentId, next), '顺序已更新')
  }

  async function moveActions(ids: number[], currentId: number, dir: -1 | 1) {
    const i = ids.indexOf(currentId)
    const j = i + dir
    if (i < 0 || j < 0 || j >= ids.length) return
    const next = ids.slice()
    const tmp = next[i]
    next[i] = next[j]
    next[j] = tmp
    await run(() => reorderPermissions(next), '顺序已更新')
  }

  function renderNode(node: CatalogNode, depth: number) {
    const open = isOpen(node.key)
    const selected = selectedKey === node.key
    const hasKids = node.children.length > 0 || node.kind === 'group' || node.kind === 'route'
    const menuIndex = node.menu ? node.siblingMenuIds.indexOf(node.menu.id) : -1
    const actionIndex = node.action ? node.siblingActionIds.indexOf(node.action.id) : -1
    const canMoveUp =
      node.kind === 'action' ? actionIndex > 0 : node.menu != null && menuIndex > 0
    const canMoveDown =
      node.kind === 'action'
        ? actionIndex >= 0 && actionIndex < node.siblingActionIds.length - 1
        : node.menu != null && menuIndex >= 0 && menuIndex < node.siblingMenuIds.length - 1
    const badgeClass =
      node.kind === 'group'
        ? styles.badgeGroup
        : node.kind === 'action'
          ? styles.badgeAction
          : styles.badgePage
    const badgeText =
      node.kind === 'group' ? '目录' : node.kind === 'action' ? '按钮' : node.kind === 'unplaced' && !node.page ? '未挂' : '菜单'

    return (
      <div key={node.key}>
        <div
          className={cx(styles.treeRow, selected && styles.treeRowActive)}
          style={{ paddingLeft: 8 + depth * 18 }}
          onClick={() => setSelectedKey(node.key)}
        >
          <button
            type="button"
            className={styles.treeToggle}
            aria-label={open ? '折叠' : '展开'}
            onClick={(e) => {
              e.stopPropagation()
              toggle(node.key)
            }}
          >
            {hasKids ? (open ? '▾' : '▸') : '·'}
          </button>
          <span className={styles.treeMain}>
            <span className={badgeClass}>{badgeText}</span>
            {node.icon || node.kind === 'group' ? (
              <span className={styles.pageCardIcon}>
                {renderMenuIcon(node.icon ?? (node.kind === 'group' ? 'FolderOutlined' : null))}
              </span>
            ) : null}
            <strong>{node.title}</strong>
            {node.extra ? <span className={styles.treeMeta}>{node.extra}</span> : null}
          </span>
          <span className={styles.treeActions} onClick={(e) => e.stopPropagation()}>
            {canUpdate && (node.menu || node.action) ? (
              <>
                <button
                  type="button"
                  className={styles.btnLink}
                  disabled={!canMoveUp}
                  onClick={() =>
                    node.kind === 'action' && node.action
                      ? moveActions(node.siblingActionIds, node.action.id, -1)
                      : node.menu
                        ? moveMenus(node.siblingMenuIds, node.parentMenuId, node.menu.id, -1)
                        : undefined
                  }
                >
                  上移
                </button>
                <button
                  type="button"
                  className={styles.btnLink}
                  disabled={!canMoveDown}
                  onClick={() =>
                    node.kind === 'action' && node.action
                      ? moveActions(node.siblingActionIds, node.action.id, 1)
                      : node.menu
                        ? moveMenus(node.siblingMenuIds, node.parentMenuId, node.menu.id, 1)
                        : undefined
                  }
                >
                  下移
                </button>
              </>
            ) : null}
            {canCreate && node.kind === 'group' && node.menu ? (
              <>
                <button type="button" className={styles.btnLink} onClick={() => openCreateGroup(node.menu!.id)}>
                  子目录
                </button>
                <button type="button" className={styles.btnLink} onClick={() => openCreatePage(node.menu!.id)}>
                  菜单
                </button>
              </>
            ) : null}
            {canCreate && node.kind === 'route' && (node.page || node.menu?.permission) ? (
              <button
                type="button"
                className={styles.btnLink}
                onClick={() => openCreateAction(node.page?.code ?? node.menu!.permission!)}
              >
                按钮
              </button>
            ) : null}
            {canCreate && node.kind === 'unplaced' && node.page ? (
              <button
                type="button"
                className={styles.btnLink}
                onClick={() => attachPage(node.page!, selectedGroupId)}
              >
                挂到侧栏
              </button>
            ) : null}
            {canUpdate && node.kind === 'group' && node.menu ? (
              <button type="button" className={styles.btnLink} onClick={() => openEditGroup(node.menu!)}>
                编辑
              </button>
            ) : null}
            {canUpdate && node.kind === 'route' && node.page ? (
              <button type="button" className={styles.btnLink} onClick={() => openEditPage(node.page!, node.menu)}>
                编辑
              </button>
            ) : null}
            {canUpdate && node.kind === 'unplaced' && node.page ? (
              <button type="button" className={styles.btnLink} onClick={() => openEditPage(node.page!)}>
                编辑
              </button>
            ) : null}
            {canUpdate && node.action ? (
              <button type="button" className={styles.btnLink} onClick={() => openEditAction(node.action!)}>
                编辑
              </button>
            ) : null}
            {canDelete && node.kind === 'group' && node.menu ? (
              <button
                type="button"
                className={styles.btnDanger}
                onClick={() =>
                  confirm(`删除目录「${node.title}」？`, () =>
                    run(() => deleteMenu(node.menu!.id), '目录已删除'),
                  )
                }
              >
                删除
              </button>
            ) : null}
            {canDelete && node.page && node.kind !== 'group' ? (
              <button
                type="button"
                className={styles.btnDanger}
                onClick={() =>
                  confirm(`删除菜单「${node.title}」及其页面权限？`, () =>
                    run(() => deletePermission(node.page!.id), '已删除'),
                  )
                }
              >
                删除
              </button>
            ) : null}
            {canDelete && node.action ? (
              <button
                type="button"
                className={styles.btnDanger}
                onClick={() =>
                  confirm(`删除按钮权限「${node.title}」？`, () =>
                    run(() => deletePermission(node.action!.id), '已删除'),
                  )
                }
              >
                删除
              </button>
            ) : null}
          </span>
        </div>
        {open
          ? node.children.map((child) => renderNode(child, depth + 1))
          : null}
      </div>
    )
  }

  return (
    <div className={styles.splitFill}>
      <article className={cx(styles.panel, styles.panelFill)}>
        <div className={styles.panelHead}>
          <h2>子系统</h2>
        </div>
        <div className={cx(styles.panelBody, styles.panelBodyFill)}>
          <ul className={styles.roleList}>
            {data.subsystems.map((sub) => {
              const count = menus.filter(
                (item) => item.nodeType !== 'group' && belongsToSubsystem(item, menus, sub.code),
              ).length
              return (
                <li
                  key={sub.code}
                  className={cx(
                    styles.roleItem,
                    sub.code === activeSubsystem && styles.roleItemActive,
                  )}
                  onClick={() => setSubsystem(sub.code)}
                >
                  <div className={styles.roleItemMain}>
                    <strong>
                      {subsystemIcons[sub.code as keyof typeof subsystemIcons] ?? null} {sub.name}
                    </strong>
                    <code>{sub.code}</code>
                    <span className={styles.tagMuted}>{count} 个菜单</span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </article>

      <article className={cx(styles.panel, styles.panelFill)}>
        <div className={styles.panelHead}>
          <h2>
            菜单树 · {data.subsystems.find((s) => s.code === activeSubsystem)?.name ?? activeSubsystem}
            <span className={styles.tagMuted} style={{ marginLeft: 8 }}>
              {routeCount} 项
            </span>
          </h2>
          <Can permission={ADMIN.permissions.create}>
            <div className={styles.treeHeadActions}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => openCreateGroup(selectedGroupId)}
              >
                新建目录
              </button>
              <button type="button" className={styles.btnPrimary} onClick={() => openCreatePage(selectedGroupId)}>
                新建菜单
              </button>
            </div>
          </Can>
        </div>
        <div className={cx(styles.panelBody, styles.panelBodyScroll)}>
          <div className={styles.catalogBanner}>
            <p>
              目录可嵌套、可折叠、可用上移/下移调整顺序。选中目录后再点「新建目录 / 新建菜单」，会挂到该目录下。
              按钮权限挂在菜单下面。
            </p>
          </div>
          {tree.length === 0 ? (
            <p className={styles.hint}>该子系统还没有目录或菜单</p>
          ) : (
            <div className={styles.treeList}>{tree.map((node) => renderNode(node, 0))}</div>
          )}
        </div>
      </article>

      <Modal
        title={editingGroup ? '编辑目录' : '新建目录'}
        open={groupOpen}
        onCancel={() => setGroupOpen(false)}
        onOk={submitGroup}
        okText="保存"
        destroyOnClose
        width={480}
      >
        <p className={styles.formTip}>
          目录只用于折叠分组，不对应页面。可挂在另一个目录下形成多级菜单。
          {groupParentId ? ' 将创建为当前选中目录的子级。' : null}
        </p>
        <Form form={groupForm} layout="vertical">
          <Form.Item name="label" label="目录名称" rules={[{ required: true }]}>
            <Input placeholder="例如 运营管理" />
          </Form.Item>
          <Form.Item name="parentId" label="上级目录">
            <Select
              options={groupOptions.filter((opt) => opt.value !== editingGroup?.id)}
            />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <IconPicker />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingPage ? '编辑菜单' : '新建菜单'}
        open={pageFormOpen}
        onCancel={() => setPageFormOpen(false)}
        onOk={submitPage}
        okText="保存"
        destroyOnClose
        width={520}
      >
        <p className={styles.formTip}>
          填写<strong>权限码 + 路由 path</strong>，保存后写入标准路由并加入当前租户侧栏。
          页面组件仍需在 Host <code>route-registry</code>（或子应用）挂载后才能打开。
        </p>
        <Form form={pageForm} layout="vertical">
          <Form.Item name="subsystem" label="所属子系统" rules={[{ required: true }]}>
            <Select
              disabled
              options={data.subsystems.map((s) => ({
                value: s.code,
                label: `${s.name}（${s.code}）`,
              }))}
            />
          </Form.Item>
          <Form.Item name="parentMenuId" label="挂到目录">
            <Select options={groupOptions} />
          </Form.Item>
          <Form.Item
            name="code"
            label="权限码"
            extra="建议 resource:action，如 asset:view"
            rules={[{ required: true, message: '请填写权限码' }]}
          >
            <Input placeholder="asset:view" disabled={Boolean(editingPage)} />
          </Form.Item>
          <Form.Item name="name" label="显示名称" rules={[{ required: true }]}>
            <Input placeholder="资产管理" />
          </Form.Item>
          <Form.Item
            name="path"
            label="路由 path"
            extra="例如 /assets；保存后加入侧栏"
            rules={[
              { required: true, message: '请填写路由 path' },
              { pattern: /^\//, message: '必须以 / 开头' },
            ]}
          >
            <Input placeholder="/assets" />
          </Form.Item>
          <Form.Item name="icon" label="图标" extra="非必填；点击选中，再点一次取消">
            <IconPicker />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingAction ? '编辑按钮权限' : '新建按钮权限'}
        open={actionFormOpen}
        onCancel={() => setActionFormOpen(false)}
        onOk={submitAction}
        okText="保存"
        destroyOnClose
      >
        <Form form={actionForm} layout="vertical">
          <Form.Item name="code" label="权限码" rules={[{ required: true }]}>
            <Input placeholder="parent:action" disabled={Boolean(editingAction)} />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
