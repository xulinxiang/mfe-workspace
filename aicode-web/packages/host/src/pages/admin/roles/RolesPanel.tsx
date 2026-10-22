import {
  parseIds,
  updateRolePermissions,
  type AdminBootstrap,
  type AdminPermission,
} from '@/api/admin'
import Can from '@/components/Can'
import { ADMIN } from '@/config/admin-permissions'
import { renderMenuIcon, subsystemIcons } from '@/config/menu-icons'
import { useAuth } from '@/context/AuthContext'
import { cx } from '@/utils/cx'
import { Modal } from 'antd'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  buildMatrixTree,
  countMatrixPages,
  defaultMatrixCollapsed,
  filterMatrixTree,
  type MatrixTreeNode,
  type PageGroup,
} from '../matrix-tree'
import styles from '../admin.module.scss'

type Props = {
  data: AdminBootstrap
  run: (action: () => Promise<unknown>, success: string) => Promise<void>
  onDataChange: (next: AdminBootstrap) => void
}

function PagePermissionCard({
  group,
  pageLabel,
  permissionIds,
  canEditMatrix,
  depth,
  onTogglePage,
  onOpenActions,
}: {
  group: PageGroup
  pageLabel: (page: AdminPermission) => string
  permissionIds: number[]
  canEditMatrix: boolean
  depth: number
  onTogglePage: () => void
  onOpenActions: () => void
}) {
  const { page, actions } = group
  const pageOn = permissionIds.includes(page.id)
  const actionOnCount = actions.filter((a) => permissionIds.includes(a.id)).length
  const hasActions = actions.length > 0

  return (
    <div className={cx(styles.pageCard, styles.matrixPageCard)}>
      <label className={styles.permLabel}>
        <input type="checkbox" checked={pageOn} disabled={!canEditMatrix} onChange={onTogglePage} />
        <strong>{pageLabel(page)}</strong>
      </label>
      <code className={styles.permCode}>{page.code}</code>
      {hasActions ? (
        <div className={styles.pageCardFoot}>
          <span className={styles.tagMuted}>
            已选 {actionOnCount}/{actions.length}
          </span>
          <button
            type="button"
            className={styles.btnLink}
            disabled={!canEditMatrix}
            onClick={onOpenActions}
          >
            配置按钮
          </button>
        </div>
      ) : (
        <span className={styles.matrixNoAction}>无按钮权限</span>
      )}
    </div>
  )
}

function PagePermissionList({
  groups,
  pageLabel,
  permissionIds,
  canEditMatrix,
  depth,
  onTogglePage,
  onOpenActions,
}: {
  groups: PageGroup[]
  pageLabel: (page: AdminPermission) => string
  permissionIds: number[]
  canEditMatrix: boolean
  depth: number
  onTogglePage: (group: PageGroup) => void
  onOpenActions: (page: AdminPermission) => void
}) {
  if (!groups.length) return null
  return (
    <div
      className={styles.matrixPageGrid}
      style={{ marginLeft: depth ? `${depth * 0.65}rem` : undefined }}
    >
      {groups.map((group) => (
        <PagePermissionCard
          key={group.page.id}
          group={group}
          pageLabel={pageLabel}
          permissionIds={permissionIds}
          canEditMatrix={canEditMatrix}
          depth={0}
          onTogglePage={() => onTogglePage(group)}
          onOpenActions={() => onOpenActions(group.page)}
        />
      ))}
    </div>
  )
}

function MatrixTreeView({
  nodes,
  depth,
  collapsed,
  onToggleGroup,
  pageLabel,
  permissionIds,
  canEditMatrix,
  onTogglePage,
  onOpenActions,
}: {
  nodes: MatrixTreeNode[]
  depth: number
  collapsed: Record<string, boolean>
  onToggleGroup: (key: string) => void
  pageLabel: (page: AdminPermission) => string
  permissionIds: number[]
  canEditMatrix: boolean
  onTogglePage: (group: PageGroup) => void
  onOpenActions: (page: AdminPermission) => void
}): ReactNode {
  const renderBranch = (node: MatrixTreeNode): ReactNode => {
    const isCollapsed = collapsed[node.key]
    const childCount = countMatrixPages(node.children)
    const pageGroups = node.children
      .filter((child): child is Extract<MatrixTreeNode, { type: 'page' }> => child.type === 'page')
      .map((child) => child.group)
    const nestedGroups = node.children.filter((child) => child.type !== 'page')

    return (
      <div key={node.key} className={styles.matrixBranch}>
        <button
          type="button"
          className={styles.matrixFolderHead}
          style={{ marginLeft: depth ? `${depth * 0.65}rem` : undefined }}
          onClick={() => onToggleGroup(node.key)}
          aria-expanded={!isCollapsed}
        >
          <span className={styles.matrixFolderToggle} aria-hidden>
            {isCollapsed ? '▸' : '▾'}
          </span>
          {node.type === 'group' && node.icon ? (
            <span className={styles.matrixFolderIcon}>{renderMenuIcon(node.icon)}</span>
          ) : null}
          <span className={styles.matrixFolderLabel}>{node.label}</span>
          <span className={styles.matrixFolderMeta}>{childCount} 页</span>
        </button>
        {!isCollapsed ? (
          <>
            <PagePermissionList
              groups={pageGroups}
              pageLabel={pageLabel}
              permissionIds={permissionIds}
              canEditMatrix={canEditMatrix}
              depth={depth + 1}
              onTogglePage={onTogglePage}
              onOpenActions={onOpenActions}
            />
            {nestedGroups.length ? (
              <MatrixTreeView
                nodes={nestedGroups}
                depth={depth + 1}
                collapsed={collapsed}
                onToggleGroup={onToggleGroup}
                pageLabel={pageLabel}
                permissionIds={permissionIds}
                canEditMatrix={canEditMatrix}
                onTogglePage={onTogglePage}
                onOpenActions={onOpenActions}
              />
            ) : null}
          </>
        ) : null}
      </div>
    )
  }

  const out: ReactNode[] = []
  let pageBatch: PageGroup[] = []
  let batchStart = 0

  const flushPages = () => {
    if (!pageBatch.length) return
    out.push(
      <PagePermissionList
        key={`pages-${batchStart}`}
        groups={pageBatch}
        pageLabel={pageLabel}
        permissionIds={permissionIds}
        canEditMatrix={canEditMatrix}
        depth={depth}
        onTogglePage={onTogglePage}
        onOpenActions={onOpenActions}
      />,
    )
    pageBatch = []
  }

  nodes.forEach((node, index) => {
    if (node.type === 'page') {
      if (!pageBatch.length) batchStart = index
      pageBatch.push(node.group)
      return
    }
    flushPages()
    out.push(renderBranch(node))
  })
  flushPages()

  return out
}

export default function RolesPanel({ data, run, onDataChange }: Props) {
  const { hasPermission } = useAuth()
  const canEditMatrix = hasPermission(ADMIN.roles.assignPermissions)
  const [activeRoleId, setActiveRoleId] = useState<number | null>(data.roles[0]?.id ?? null)
  const [roleKeyword, setRoleKeyword] = useState('')
  const [pageKeyword, setPageKeyword] = useState('')
  const [matrixSub, setMatrixSub] = useState<string>('all')
  const [matrixCollapsed, setMatrixCollapsed] = useState<Record<string, boolean>>({})
  const [actionPageCode, setActionPageCode] = useState<string | null>(null)

  const filteredRoles = useMemo(() => {
    const q = roleKeyword.trim().toLowerCase()
    if (!q) return data.roles
    return data.roles.filter(
      (role) => role.name.toLowerCase().includes(q) || role.code.toLowerCase().includes(q),
    )
  }, [data.roles, roleKeyword])

  const activeRole = useMemo(
    () => data.roles.find((r) => r.id === activeRoleId) ?? null,
    [data.roles, activeRoleId],
  )

  const pageLabelByCode = useMemo(() => {
    const map = new Map<string, string>()
    for (const route of data.routeCatalog) {
      if (route.permission && route.label) map.set(route.permission, route.label)
    }
    for (const menu of data.menus ?? []) {
      if (menu.permission && menu.label) map.set(menu.permission, menu.label)
    }
    return map
  }, [data.routeCatalog, data.menus])

  const pageLabel = (page: AdminPermission) => pageLabelByCode.get(page.code) ?? page.name

  const pagesBySubsystem = useMemo(() => {
    const pages = data.permissions.filter((p) => (p.resourceType ?? 'page') === 'page')
    const actions = data.permissions.filter((p) => p.resourceType === 'action')
    const map = new Map<string, PageGroup[]>()
    for (const page of pages) {
      const key = page.subsystem ?? '其他'
      const list = map.get(key) ?? []
      list.push({
        page,
        actions: actions.filter((a) => a.parentCode === page.code),
      })
      map.set(key, list)
    }
    return [...map.entries()]
  }, [data.permissions])

  const subsystemSections = useMemo(() => {
    const menus = data.menus ?? []
    const searchable = { pageLabel }
    const sections =
      matrixSub === 'all'
        ? pagesBySubsystem
        : pagesBySubsystem.filter(([code]) => code === matrixSub)

    return sections.map(([subsystem, groups]) => {
      const tree = buildMatrixTree(subsystem, menus, groups)
      const filtered = filterMatrixTree(tree, pageKeyword, searchable)
      return {
        subsystem,
        tree: filtered,
        pageCount: countMatrixPages(filtered),
      }
    })
  }, [pagesBySubsystem, data.menus, matrixSub, pageKeyword, pageLabelByCode])

  const visiblePageCount = useMemo(
    () => subsystemSections.reduce((sum, section) => sum + section.pageCount, 0),
    [subsystemSections],
  )

  const matrixSearching = pageKeyword.trim().length > 0
  const matrixCollapsedView = matrixSearching ? {} : matrixCollapsed

  useEffect(() => {
    if (matrixSearching) return
    setMatrixCollapsed(defaultMatrixCollapsed(subsystemSections.map((section) => section.tree)))
  }, [matrixSub, activeRoleId, matrixSearching, subsystemSections])

  const actionModalGroup = useMemo(() => {
    if (!actionPageCode) return null
    for (const [, groups] of pagesBySubsystem) {
      const found = groups.find((g) => g.page.code === actionPageCode)
      if (found) return found
    }
    return null
  }, [actionPageCode, pagesBySubsystem])

  function patchRolePermissions(nextIds: number[]) {
    if (!activeRole) return
    onDataChange({
      ...data,
      roles: data.roles.map((role) =>
        role.id === activeRole.id ? { ...role, permissionIds: nextIds.join(',') } : role,
      ),
    })
  }

  function togglePage(page: AdminPermission, actions: AdminPermission[]) {
    if (!activeRole || !canEditMatrix) return
    const ids = parseIds(activeRole.permissionIds)
    const on = ids.includes(page.id)
    if (on) {
      const remove = new Set([page.id, ...actions.map((a) => a.id)])
      patchRolePermissions(ids.filter((id) => !remove.has(id)))
    } else {
      patchRolePermissions([...ids, page.id])
    }
  }

  function toggleAction(action: AdminPermission, page: AdminPermission) {
    if (!activeRole || !canEditMatrix) return
    const ids = parseIds(activeRole.permissionIds)
    const on = ids.includes(action.id)
    if (on) {
      patchRolePermissions(ids.filter((id) => id !== action.id))
    } else {
      const next = ids.includes(page.id) ? [...ids, action.id] : [...ids, page.id, action.id]
      patchRolePermissions(next)
    }
  }

  function openActions(page: AdminPermission) {
    if (!activeRole) return
    const ids = parseIds(activeRole.permissionIds)
    if (!ids.includes(page.id)) {
      if (!canEditMatrix) return
      patchRolePermissions([...ids, page.id])
    }
    setActionPageCode(page.code)
  }

  function selectAllActions(group: PageGroup) {
    if (!activeRole || !canEditMatrix || !group.actions.length) return
    const ids = new Set(parseIds(activeRole.permissionIds))
    ids.add(group.page.id)
    for (const action of group.actions) ids.add(action.id)
    patchRolePermissions([...ids])
  }

  function invertActions(group: PageGroup) {
    if (!activeRole || !canEditMatrix || !group.actions.length) return
    const ids = new Set(parseIds(activeRole.permissionIds))
    for (const action of group.actions) {
      if (ids.has(action.id)) ids.delete(action.id)
      else ids.add(action.id)
    }
    const anyAction = group.actions.some((action) => ids.has(action.id))
    if (anyAction) ids.add(group.page.id)
    else ids.delete(group.page.id)
    patchRolePermissions([...ids])
  }

  return (
    <div className={styles.splitFill}>
      <article className={cx(styles.panel, styles.panelFill)}>
        <div className={styles.panelHead}>
          <h2>选择角色</h2>
        </div>
        <div className={cx(styles.panelBody, styles.panelBodyFill)}>
          <div className={styles.inlineForm}>
            <input
              placeholder="搜索编码 / 名称"
              value={roleKeyword}
              onChange={(e) => setRoleKeyword(e.target.value)}
            />
          </div>
          <ul className={styles.roleList}>
            {filteredRoles.map((role) => {
              const permCount = parseIds(role.permissionIds).length
              return (
              <li
                key={role.id}
                className={cx(styles.roleItem, role.id === activeRoleId && styles.roleItemActive)}
                onClick={() => setActiveRoleId(role.id)}
              >
                <div className={styles.roleItemMain}>
                  <strong>{role.name}</strong>
                  <code className={cx(styles.metaTag, styles.metaTagKey)}>{role.code}</code>
                </div>
                <span className={styles.roleItemCount}>{permCount} 项权限</span>
              </li>
              )
            })}
          </ul>
          {filteredRoles.length === 0 ? <p className={styles.hint}>没有匹配的角色</p> : null}
        </div>
      </article>

      <article className={cx(styles.panel, styles.panelFill)}>
        <div className={styles.panelHead}>
          <h2>{activeRole ? `页面权限 · ${activeRole.name}` : '页面权限'}</h2>
          {activeRole && canEditMatrix ? (
            <Can permission={ADMIN.roles.assignPermissions}>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() =>
                  run(
                    () =>
                      updateRolePermissions(activeRole.id, parseIds(activeRole.permissionIds)),
                    '权限已保存',
                  )
                }
              >
                保存权限
              </button>
            </Can>
          ) : null}
        </div>
        <div className={cx(styles.panelBody, styles.panelBodyScroll)}>
          {!activeRole ? (
            <p className={styles.hint}>请选择左侧角色</p>
          ) : (
            <>
              <div className={styles.matrixToolbar}>
                <div className={styles.matrixTabs} role="tablist" aria-label="子系统筛选">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={matrixSub === 'all'}
                    className={cx(styles.matrixTab, matrixSub === 'all' && styles.matrixTabActive)}
                    onClick={() => setMatrixSub('all')}
                  >
                    全部
                  </button>
                  {data.subsystems.map((sub) => (
                    <button
                      key={sub.code}
                      type="button"
                      role="tab"
                      aria-selected={matrixSub === sub.code}
                      className={cx(styles.matrixTab, matrixSub === sub.code && styles.matrixTabActive)}
                      onClick={() => setMatrixSub(sub.code)}
                    >
                      {subsystemIcons[sub.code as keyof typeof subsystemIcons] ?? null} {sub.name}
                    </button>
                  ))}
                </div>
                <div className={styles.matrixSearchRow}>
                  <input
                    className={styles.matrixSearch}
                    placeholder="搜索页面名称、权限码、按钮权限"
                    value={pageKeyword}
                    onChange={(e) => setPageKeyword(e.target.value)}
                  />
                  <span className={styles.matrixSearchMeta}>
                    {visiblePageCount} 个页面
                    {pageKeyword.trim() ? ' · 已筛选' : ''}
                  </span>
                </div>
              </div>

              {subsystemSections.every((s) => s.pageCount === 0) ? (
                <p className={styles.hint}>没有匹配的页面权限，试试换个关键词或子系统。</p>
              ) : (
                <div className={styles.matrixBoard}>
                  <div className={styles.matrixBoardInner}>
                    {subsystemSections.map(({ subsystem, tree, pageCount }) =>
                      pageCount === 0 ? null : (
                        <section key={subsystem} className={styles.matrixSubBlock}>
                          {matrixSub === 'all' ? (
                            <header className={styles.matrixSubHead}>
                              <span className={styles.matrixSubHeadTitle}>
                                {subsystemIcons[subsystem as keyof typeof subsystemIcons] ?? null}{' '}
                                {data.subsystems.find((s) => s.code === subsystem)?.name ?? subsystem}
                              </span>
                              <span className={styles.treeMeta}>{pageCount} 页</span>
                            </header>
                          ) : null}
                          <MatrixTreeView
                            nodes={tree}
                            depth={0}
                            collapsed={matrixCollapsedView}
                            onToggleGroup={(key) => {
                              if (matrixSearching) return
                              setMatrixCollapsed((map) => ({ ...map, [key]: !map[key] }))
                            }}
                            pageLabel={pageLabel}
                            permissionIds={parseIds(activeRole.permissionIds)}
                            canEditMatrix={canEditMatrix}
                            onTogglePage={({ page, actions }) => togglePage(page, actions)}
                            onOpenActions={openActions}
                          />
                        </section>
                      ),
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </article>

      <Modal
        title={
          actionModalGroup
            ? `按钮权限 · ${pageLabel(actionModalGroup.page)}`
            : '按钮权限'
        }
        open={actionModalGroup != null}
        onCancel={() => setActionPageCode(null)}
        footer={
          <button type="button" className={styles.btnPrimary} onClick={() => setActionPageCode(null)}>
            完成
          </button>
        }
        destroyOnClose
        width={480}
      >
        {actionModalGroup && activeRole ? (
          <div className={styles.actionModalBody}>
            {actionModalGroup.actions.length > 0 ? (
              <div className={styles.actionModalToolbar}>
                <span className={styles.actionModalHint}>勾选操作将同步保留页面访问权限</span>
                <div className={styles.actionModalToolbarActions}>
                  <button
                    type="button"
                    className={styles.btnGhost}
                    disabled={!canEditMatrix}
                    onClick={() => selectAllActions(actionModalGroup)}
                  >
                    全选
                  </button>
                  <button
                    type="button"
                    className={styles.btnGhost}
                    disabled={!canEditMatrix}
                    onClick={() => invertActions(actionModalGroup)}
                  >
                    反选
                  </button>
                </div>
              </div>
            ) : null}
            <ul className={styles.permCheckList}>
              {actionModalGroup.actions.map((action) => {
                const checked = parseIds(activeRole.permissionIds).includes(action.id)
                return (
                  <li key={action.id} className={cx(styles.permCheckItem, checked && styles.permCheckItemSelected)}>
                    <label className={styles.permLabel}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!canEditMatrix}
                        onChange={() => toggleAction(action, actionModalGroup.page)}
                      />
                      <span className={styles.badgeAction}>操作</span>
                      <span className={styles.permCheckName}>{action.name}</span>
                      <code className={styles.permCode}>{action.code}</code>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
