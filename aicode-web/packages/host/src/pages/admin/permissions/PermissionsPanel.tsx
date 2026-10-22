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
import { ADMIN } from '@/config/admin-permissions'
import {
  actionCodeRestError,
  codePrefixOf,
  composeActionCode,
  composePageCode,
  composePagePath,
  mountOf,
  pageCodeRestError,
  pagePathRestError,
  pathPrefixOf,
  splitActionCode,
  splitPageCode,
  splitPagePath,
} from '@/config/catalog-rules'
import { MENU_ICON_OPTIONS, renderMenuIcon, subsystemIcons } from '@/config/menu-icons'
import { useAuth } from '@/context/AuthContext'
import { cx } from '@/utils/cx'
import { Form, Input, Modal } from 'antd'
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

function findCatalogNode(nodes: CatalogNode[], key: string | null): CatalogNode | null {
  if (!key) return null
  for (const node of nodes) {
    if (node.key === key) return node
    const child = findCatalogNode(node.children, key)
    if (child) return child
  }
  return null
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
  const [groupForm] = Form.useForm<{ label: string; icon?: string | null }>()

  const [pageFormOpen, setPageFormOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<AdminPermission | null>(null)
  const [pageParentId, setPageParentId] = useState<number | null>(null)
  const [pageCodePrefix, setPageCodePrefix] = useState('host:')
  const [pageForm] = Form.useForm<{
    code: string
    name: string
    subsystem: string
    path: string
    icon?: string | null
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

  const selectedNode = useMemo(() => findCatalogNode(tree, selectedKey), [tree, selectedKey])
  const selectedGroupId =
    selectedNode?.kind === 'group' && selectedNode.menu ? selectedNode.menu.id : null
  const hangGroupId = (() => {
    if (!selectedNode) return null
    if (selectedNode.kind === 'group') return selectedNode.menu?.id ?? null
    if (selectedNode.kind === 'route') return selectedNode.menu?.parentId ?? null
    if (selectedNode.kind === 'action') {
      const route = menus.find((item) => item.id === selectedNode.parentMenuId)
      return route?.parentId ?? null
    }
    return null
  })()
  const selectedParentCode =
    selectedNode?.kind === 'route'
      ? (selectedNode.page?.code ?? selectedNode.menu?.permission ?? null)
      : selectedNode?.kind === 'action'
        ? (selectedNode.action?.parentCode ?? null)
        : null

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

  function hangLabel(parentId: number | null) {
    if (parentId == null) return '侧栏根级'
    return groupsInSubsystem.find((g) => g.id === parentId)?.label ?? `目录 #${parentId}`
  }

  const pageMount = mountOf(activeSubsystem)

  function openCreateGroup(parentId: number | null) {
    setEditingGroup(null)
    setGroupParentId(parentId)
    groupForm.setFieldsValue({ label: '', icon: 'FolderOutlined' })
    setGroupOpen(true)
  }

  function openEditGroup(item: AdminMenuItem) {
    setEditingGroup(item)
    setGroupParentId(item.parentId ?? null)
    groupForm.setFieldsValue({
      label: item.label,
      icon: item.icon ?? 'FolderOutlined',
    })
    setGroupOpen(true)
  }

  async function submitGroup() {
    const values = await groupForm.validateFields()
    const payload = {
      label: values.label.trim(),
      icon: values.icon ?? null,
      app: activeSubsystem,
      nodeType: 'group' as const,
      parentId: groupParentId,
    }
    await run(async () => {
      if (editingGroup) await updateMenu(editingGroup.id, { ...payload, key: editingGroup.menuKey })
      else await createMenu(payload)
      setGroupOpen(false)
    }, editingGroup ? '目录已更新' : '目录已创建')
  }

  function openCreatePage(parentId: number | null) {
    setEditingPage(null)
    setPageParentId(parentId)
    setPageCodePrefix(codePrefixOf(activeSubsystem))
    pageForm.setFieldsValue({
      code: '',
      name: '',
      subsystem: activeSubsystem,
      path: '',
      icon: null,
    })
    setPageFormOpen(true)
  }

  function openEditPage(page: AdminPermission, menu?: AdminMenuItem) {
    setEditingPage(page)
    const catalog = catalogByPermission.get(page.code)
    const subsystem = page.subsystem ?? activeSubsystem
    const splitCode = splitPageCode(page.code, subsystem)
    const fullPath = catalog?.path ?? menu?.path ?? ''
    setPageParentId(menu?.parentId ?? null)
    setPageCodePrefix(splitCode.prefix)
    pageForm.setFieldsValue({
      code: splitCode.rest,
      name: page.name,
      subsystem,
      path: splitPagePath(fullPath, subsystem).rest,
      icon: catalog?.icon ?? menu?.icon ?? null,
    })
    setPageFormOpen(true)
  }

  async function submitPage() {
    const values = await pageForm.validateFields()
    const subsystem = values.subsystem || activeSubsystem
    const payload = {
      code: editingPage ? editingPage.code : composePageCode(pageCodePrefix, values.code),
      name: values.name.trim(),
      resourceType: 'page' as const,
      subsystem,
      parentCode: null,
      path: composePagePath(subsystem, values.path ?? ''),
      icon: values.icon ?? null,
      parentMenuId: pageParentId,
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
    actionForm.setFieldsValue({ code: '', name: '' })
    setActionFormOpen(true)
  }

  function openEditAction(action: AdminPermission) {
    setEditingAction(action)
    setActionParentCode(action.parentCode ?? null)
    actionForm.setFieldsValue({
      code: action.parentCode ? splitActionCode(action.code, action.parentCode) : action.code,
      name: action.name,
    })
    setActionFormOpen(true)
  }

  async function submitAction() {
    if (!actionParentCode) return
    const values = await actionForm.validateFields()
    const payload = {
      code: editingAction ? editingAction.code : composeActionCode(actionParentCode, values.code),
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
        </div>
        {open
          ? node.children.map((child) => renderNode(child, depth + 1))
          : null}
      </div>
    )
  }

  function selectedMoveState() {
    if (!selectedNode) return { up: false, down: false }
    if (selectedNode.kind === 'action' && selectedNode.action) {
      const i = selectedNode.siblingActionIds.indexOf(selectedNode.action.id)
      return { up: i > 0, down: i >= 0 && i < selectedNode.siblingActionIds.length - 1 }
    }
    if (selectedNode.menu) {
      const i = selectedNode.siblingMenuIds.indexOf(selectedNode.menu.id)
      return { up: i > 0, down: i >= 0 && i < selectedNode.siblingMenuIds.length - 1 }
    }
    return { up: false, down: false }
  }

  function onMove(dir: -1 | 1) {
    if (!selectedNode) return
    if (selectedNode.kind === 'action' && selectedNode.action) {
      return moveActions(selectedNode.siblingActionIds, selectedNode.action.id, dir)
    }
    if (selectedNode.menu) {
      return moveMenus(
        selectedNode.siblingMenuIds,
        selectedNode.parentMenuId,
        selectedNode.menu.id,
        dir,
      )
    }
  }

  function onEditSelected() {
    if (!selectedNode) return
    if (selectedNode.kind === 'group' && selectedNode.menu) openEditGroup(selectedNode.menu)
    else if (selectedNode.kind === 'action' && selectedNode.action) openEditAction(selectedNode.action)
    else if (selectedNode.page) openEditPage(selectedNode.page, selectedNode.menu)
  }

  function onDeleteSelected() {
    if (!selectedNode) return
    if (selectedNode.kind === 'group' && selectedNode.menu) {
      confirm(`删除目录「${selectedNode.title}」？`, () =>
        run(() => deleteMenu(selectedNode.menu!.id), '目录已删除'),
      )
      return
    }
    if (selectedNode.action) {
      confirm(`删除按钮权限「${selectedNode.title}」？`, () =>
        run(() => deletePermission(selectedNode.action!.id), '已删除'),
      )
      return
    }
    if (selectedNode.page) {
      confirm(`删除菜单「${selectedNode.title}」及其页面权限？`, () =>
        run(() => deletePermission(selectedNode.page!.id), '已删除'),
      )
    }
  }

  const moveState = selectedMoveState()
  const canEditSelected = Boolean(
    selectedNode &&
      (selectedNode.menu || selectedNode.action || selectedNode.page) &&
      selectedNode.key !== 'unplaced-root',
  )
  const toolbarHint = !selectedNode
    ? '未选中节点：新建会加到当前子系统根级。点一行再操作上移、编辑或挂子级。'
    : selectedNode.kind === 'group'
      ? `已选目录「${selectedNode.title}」：可在它下面新建子目录或菜单。`
      : selectedNode.kind === 'route'
        ? `已选菜单「${selectedNode.title}」：可新建按钮权限；新建菜单会挂到同一目录下。`
        : selectedNode.kind === 'action'
          ? `已选按钮「${selectedNode.title}」`
          : selectedNode.page
            ? `已选未挂菜单「${selectedNode.title}」`
            : '未挂侧栏的页面，可先选目录再点「挂到侧栏」。'

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
        </div>
        <div className={cx(styles.panelBody, styles.panelBodyScroll)}>
          <div className={styles.treeToolbar}>
            <p className={styles.treeToolbarHint}>{toolbarHint}</p>
            <div className={styles.treeHeadActions}>
              <button
                type="button"
                className={styles.btnGhost}
                disabled={!canCreate}
                title={canCreate ? undefined : '需要按钮权限 admin:permissions:create'}
                onClick={() => openCreateGroup(selectedGroupId)}
              >
                新建目录
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={!canCreate}
                title={canCreate ? undefined : '需要按钮权限 admin:permissions:create'}
                onClick={() => openCreatePage(hangGroupId)}
              >
                新建菜单
              </button>
              <button
                type="button"
                className={styles.btnGhost}
                disabled={!canCreate || !selectedParentCode}
                title={!selectedParentCode ? '先选中一个菜单，再新建它的按钮权限' : undefined}
                onClick={() => selectedParentCode && openCreateAction(selectedParentCode)}
              >
                新建按钮
              </button>
              {selectedNode?.kind === 'unplaced' && selectedNode.page ? (
                <button
                  type="button"
                  className={styles.btnGhost}
                  disabled={!canCreate}
                  onClick={() => attachPage(selectedNode.page!, selectedGroupId)}
                >
                  挂到侧栏
                </button>
              ) : null}
              <button
                type="button"
                className={styles.btnGhost}
                disabled={!canUpdate || !moveState.up}
                onClick={() => onMove(-1)}
              >
                上移
              </button>
              <button
                type="button"
                className={styles.btnGhost}
                disabled={!canUpdate || !moveState.down}
                onClick={() => onMove(1)}
              >
                下移
              </button>
              <button
                type="button"
                className={styles.btnGhost}
                disabled={!canUpdate || !canEditSelected}
                onClick={onEditSelected}
              >
                编辑
              </button>
              <button
                type="button"
                className={styles.btnDanger}
                disabled={!canDelete || !canEditSelected}
                onClick={onDeleteSelected}
              >
                删除
              </button>
            </div>
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
          目录只用于折叠分组，不对应页面。将挂到
          <strong> {hangLabel(groupParentId)} </strong>
          （左侧先选目录再点新建；根级则不要选中任何目录）。
        </p>
        <Form form={groupForm} layout="vertical">
          <Form.Item name="label" label="目录名称" rules={[{ required: true }]}>
            <Input placeholder="例如 运营管理" />
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
          将挂到<strong> {hangLabel(pageParentId)} </strong>
          。子系统前缀已带入，保存为
          <strong> {`${pageCodePrefix}${pageMount.exampleRest}`}</strong>
          ，路由
          <strong> {`${pathPrefixOf(activeSubsystem)}${pageMount.examplePathRest}`}</strong>
          。页面组件仍须在 {pageMount.routerHint} 里声明。
        </p>
        <Form form={pageForm} layout="vertical">
          <Form.Item name="subsystem" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="code"
            label="权限码"
            extra={`只需填后半段，两个子应用都可写 ${pageMount.exampleRest}，完整码不会撞`}
            rules={[
              { required: true, message: '填写资源:操作' },
              {
                validator: async (_, value) => {
                  const err = pageCodeRestError(String(value ?? ''))
                  if (err) throw new Error(err)
                },
              },
            ]}
          >
            <Input
              addonBefore={pageCodePrefix}
              placeholder={pageMount.exampleRest}
              disabled={Boolean(editingPage)}
            />
          </Form.Item>
          <Form.Item name="name" label="显示名称" rules={[{ required: true }]}>
            <Input placeholder="店铺列表" />
          </Form.Item>
          <Form.Item
            name="path"
            label="前端路由"
            extra={`相对当前子系统挂载点。空则落在 ${mountOf(activeSubsystem).pathPrefix || '/'} `}
            rules={[
              {
                validator: async (_, value) => {
                  const err = pagePathRestError(String(value ?? ''), activeSubsystem)
                  if (err) throw new Error(err)
                },
              },
            ]}
          >
            <Input
              addonBefore={pathPrefixOf(activeSubsystem)}
              placeholder={pageMount.examplePathRest}
            />
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
          <Form.Item
            name="code"
            label="权限码"
            extra="前缀已带上所属页面码，这里只填操作名"
            rules={[
              { required: true, message: '填写操作名' },
              {
                validator: async (_, value) => {
                  const err = actionCodeRestError(String(value ?? ''))
                  if (err) throw new Error(err)
                },
              },
            ]}
          >
            <Input
              addonBefore={actionParentCode ? `${actionParentCode}:` : undefined}
              placeholder="create"
              disabled={Boolean(editingAction)}
            />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
