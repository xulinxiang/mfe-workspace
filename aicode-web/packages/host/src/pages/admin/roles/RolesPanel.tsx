import {
  parseIds,
  updateRolePermissions,
  type AdminBootstrap,
  type AdminPermission,
} from '@/api/admin'
import Can from '@/components/Can'
import { ADMIN } from '@/config/admin-permissions'
import { subsystemIcons } from '@/config/menu-icons'
import { useAuth } from '@/context/AuthContext'
import { cx } from '@/utils/cx'
import { Modal } from 'antd'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import styles from '../admin.module.scss'

type Props = {
  data: AdminBootstrap
  run: (action: () => Promise<unknown>, success: string) => Promise<void>
  onDataChange: (next: AdminBootstrap) => void
}

type PageGroup = {
  page: AdminPermission
  actions: AdminPermission[]
}

export default function RolesPanel({ data, run, onDataChange }: Props) {
  const { hasPermission } = useAuth()
  const canEditMatrix = hasPermission(ADMIN.roles.assignPermissions)
  const [activeRoleId, setActiveRoleId] = useState<number | null>(data.roles[0]?.id ?? null)
  const [keyword, setKeyword] = useState('')
  const [actionPageCode, setActionPageCode] = useState<string | null>(null)

  const filteredRoles = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return data.roles
    return data.roles.filter(
      (role) => role.name.toLowerCase().includes(q) || role.code.toLowerCase().includes(q),
    )
  }, [data.roles, keyword])

  const activeRole = useMemo(
    () => data.roles.find((r) => r.id === activeRoleId) ?? null,
    [data.roles, activeRoleId],
  )

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
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <p className={styles.formTip}>
            增删改角色请到 <Link to="/admin/role-manage">角色管理</Link>
          </p>
          <ul className={styles.roleList}>
            {filteredRoles.map((role) => (
              <li
                key={role.id}
                className={cx(styles.roleItem, role.id === activeRoleId && styles.roleItemActive)}
                onClick={() => setActiveRoleId(role.id)}
              >
                <div className={styles.roleItemMain}>
                  <strong>{role.name}</strong>
                  <code>{role.code}</code>
                  <span className={styles.tagMuted}>
                    {parseIds(role.permissionIds).length} 项权限
                  </span>
                </div>
              </li>
            ))}
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
              {pagesBySubsystem.map(([subsystem, groups]) => (
                <section key={subsystem} className={styles.matrixSection}>
                  <h3 className={styles.matrixTitle}>
                    {subsystemIcons[subsystem as keyof typeof subsystemIcons] ?? null} {subsystem}
                  </h3>
                  <div className={styles.pageGrid}>
                    {groups.map(({ page, actions }) => {
                      const ids = parseIds(activeRole.permissionIds)
                      const pageOn = ids.includes(page.id)
                      const actionOnCount = actions.filter((a) => ids.includes(a.id)).length
                      return (
                        <div key={page.id} className={styles.pageCard}>
                          <label className={styles.permLabel}>
                            <input
                              type="checkbox"
                              checked={pageOn}
                              disabled={!canEditMatrix}
                              onChange={() => togglePage(page, actions)}
                            />
                            <span className={styles.badgePage}>页面</span>
                            <strong>{page.name}</strong>
                          </label>
                          <code className={styles.permCode}>{page.code}</code>
                          <div className={styles.pageCardFoot}>
                            {actions.length ? (
                              <>
                                <span className={styles.tagMuted}>
                                  已选操作 {actionOnCount}/{actions.length}
                                </span>
                                <button
                                  type="button"
                                  className={styles.btnLink}
                                  disabled={!canEditMatrix}
                                  onClick={() => openActions(page)}
                                >
                                  配置按钮权限
                                </button>
                              </>
                            ) : (
                              <span className={styles.tagMuted}>无按钮权限</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              ))}
            </>
          )}
        </div>
      </article>

      <Modal
        title={
          actionModalGroup
            ? `按钮权限 · ${actionModalGroup.page.name}`
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
            <p className={styles.hint}>
              页面 <code className={styles.permCode}>{actionModalGroup.page.code}</code>{' '}
              下的操作权限；勾选操作时会自动保留页面权限。
            </p>
            <ul className={styles.actionCheckList}>
              {actionModalGroup.actions.map((action) => {
                const checked = parseIds(activeRole.permissionIds).includes(action.id)
                return (
                  <li key={action.id}>
                    <label className={styles.permLabel}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!canEditMatrix}
                        onChange={() => toggleAction(action, actionModalGroup.page)}
                      />
                      <span className={styles.badgeAction}>操作</span>
                      {action.name}
                      <span className={styles.permCode}>{action.code}</span>
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
