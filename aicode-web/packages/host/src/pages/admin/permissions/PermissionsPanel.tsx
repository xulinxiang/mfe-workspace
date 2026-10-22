import {
  createPermission,
  deletePermission,
  updatePermission,
  type AdminBootstrap,
  type AdminPermission,
} from '@/api/admin'
import Can from '@/components/Can'
import { ADMIN } from '@/config/admin-permissions'
import { MENU_ICON_OPTIONS, renderMenuIcon, subsystemIcons } from '@/config/menu-icons'
import { useAuth } from '@/context/AuthContext'
import { cx } from '@/utils/cx'
import { Form, Input, Modal, Select } from 'antd'
import { useMemo, useState } from 'react'
import styles from '../admin.module.scss'

type Props = {
  data: AdminBootstrap
  run: (action: () => Promise<unknown>, success: string) => Promise<void>
}

type PageGroup = {
  page: AdminPermission
  actions: AdminPermission[]
}

/** 按钮权限草稿：未点最终「保存」前不落库 */
type DraftAction = {
  key: string
  id?: number
  code: string
  name: string
}

let draftKeySeq = 0
function nextDraftKey() {
  draftKeySeq += 1
  return `draft-${draftKeySeq}`
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

export default function PermissionsPanel({ data, run }: Props) {
  const { hasPermission } = useAuth()
  const canCreate = hasPermission(ADMIN.permissions.create)
  const canUpdate = hasPermission(ADMIN.permissions.update)
  const canDelete = hasPermission(ADMIN.permissions.delete)

  const [activeSubsystem, setActiveSubsystem] = useState(data.subsystems[0]?.code ?? 'host')
  const [actionPageCode, setActionPageCode] = useState<string | null>(null)
  const [draftActions, setDraftActions] = useState<DraftAction[]>([])
  const [removedIds, setRemovedIds] = useState<number[]>([])
  const [pageFormOpen, setPageFormOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<AdminPermission | null>(null)
  const [actionFormOpen, setActionFormOpen] = useState(false)
  const [editingDraftKey, setEditingDraftKey] = useState<string | null>(null)
  const [pageForm] = Form.useForm<{
    code: string
    name: string
    subsystem: string
    path: string
    icon?: string | null
  }>()
  const [actionForm] = Form.useForm<{ code: string; name: string }>()

  const catalogByPermission = useMemo(() => {
    const map = new Map<string, { path: string; icon?: string | null }>()
    for (const entry of data.routeCatalog) {
      map.set(entry.permission, { path: entry.path, icon: entry.icon })
    }
    return map
  }, [data.routeCatalog])

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
    return map
  }, [data.permissions])

  const currentGroups = pagesBySubsystem.get(activeSubsystem) ?? []
  const actionModalPage = useMemo(() => {
    if (!actionPageCode) return null
    for (const groups of pagesBySubsystem.values()) {
      const found = groups.find((g) => g.page.code === actionPageCode)
      if (found) return found.page
    }
    return null
  }, [actionPageCode, pagesBySubsystem])

  function openActionEditor(page: AdminPermission, actions: AdminPermission[]) {
    setActionPageCode(page.code)
    setDraftActions(
      actions.map((a) => ({
        key: `id-${a.id}`,
        id: a.id,
        code: a.code,
        name: a.name,
      })),
    )
    setRemovedIds([])
    setActionFormOpen(false)
    setEditingDraftKey(null)
  }

  function closeActionEditor() {
    setActionPageCode(null)
    setDraftActions([])
    setRemovedIds([])
    setActionFormOpen(false)
    setEditingDraftKey(null)
  }

  function openCreatePage() {
    setEditingPage(null)
    pageForm.setFieldsValue({
      code: '',
      name: '',
      subsystem: activeSubsystem,
      path: '',
      icon: null,
    })
    setPageFormOpen(true)
  }

  function openEditPage(page: AdminPermission) {
    setEditingPage(page)
    const catalog = catalogByPermission.get(page.code)
    pageForm.setFieldsValue({
      code: page.code,
      name: page.name,
      subsystem: page.subsystem ?? activeSubsystem,
      path: catalog?.path ?? '',
      icon: catalog?.icon ?? null,
    })
    setPageFormOpen(true)
  }

  async function submitPage() {
    const values = await pageForm.validateFields()
    const payload = {
      code: values.code.trim(),
      name: values.name.trim(),
      resourceType: 'page' as const,
      subsystem: values.subsystem,
      parentCode: null,
      path: values.path.trim(),
      icon: values.icon ?? null,
    }
    await run(async () => {
      if (editingPage) await updatePermission(editingPage.id, payload)
      else await createPermission(payload)
      setPageFormOpen(false)
    }, editingPage ? '页面权限已更新' : '页面权限已创建')
  }

  function openCreateAction() {
    if (!actionPageCode) return
    setEditingDraftKey(null)
    actionForm.setFieldsValue({ code: `${actionPageCode}:`, name: '' })
    setActionFormOpen(true)
  }

  function openEditDraft(item: DraftAction) {
    setEditingDraftKey(item.key)
    actionForm.setFieldsValue({ code: item.code, name: item.name })
    setActionFormOpen(true)
  }

  async function applyActionToDraft() {
    const values = await actionForm.validateFields()
    const code = values.code.trim()
    const name = values.name.trim()
    const dup = draftActions.some(
      (a) => a.code === code && a.key !== editingDraftKey,
    )
    if (dup) {
      throw new Error('列表中已有相同权限码')
    }

    if (editingDraftKey) {
      setDraftActions((list) =>
        list.map((a) => (a.key === editingDraftKey ? { ...a, code, name } : a)),
      )
    } else {
      setDraftActions((list) => [...list, { key: nextDraftKey(), code, name }])
    }
    setActionFormOpen(false)
    setEditingDraftKey(null)
  }

  function removeDraft(item: DraftAction) {
    setDraftActions((list) => list.filter((a) => a.key !== item.key))
    if (item.id != null) {
      setRemovedIds((ids) => (ids.includes(item.id!) ? ids : [...ids, item.id!]))
    }
  }

  async function persistActionDraft() {
    if (!actionPageCode || !actionModalPage) return
    const subsystem = actionModalPage.subsystem ?? activeSubsystem
    const original = data.permissions.filter(
      (p) => p.resourceType === 'action' && p.parentCode === actionPageCode,
    )
    const originalById = new Map(original.map((a) => [a.id, a]))

    await run(async () => {
      for (const id of removedIds) {
        await deletePermission(id)
      }
      for (const item of draftActions) {
        if (item.id == null) {
          await createPermission({
            code: item.code,
            name: item.name,
            resourceType: 'action',
            parentCode: actionPageCode,
            subsystem,
          })
          continue
        }
        const prev = originalById.get(item.id)
        if (!prev || prev.code !== item.code || prev.name !== item.name) {
          await updatePermission(item.id, {
            code: item.code,
            name: item.name,
            resourceType: 'action',
            parentCode: actionPageCode,
            subsystem,
          })
        }
      }
      closeActionEditor()
    }, '按钮权限已保存')
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
              const count = pagesBySubsystem.get(sub.code)?.length ?? 0
              return (
                <li
                  key={sub.code}
                  className={cx(
                    styles.roleItem,
                    sub.code === activeSubsystem && styles.roleItemActive,
                  )}
                  onClick={() => setActiveSubsystem(sub.code)}
                >
                  <div className={styles.roleItemMain}>
                    <strong>
                      {subsystemIcons[sub.code as keyof typeof subsystemIcons] ?? null} {sub.name}
                    </strong>
                    <code>{sub.code}</code>
                    <span className={styles.tagMuted}>{count} 个页面</span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </article>

      <article className={cx(styles.panel, styles.panelFill)}>
        <div className={styles.panelHead}>
          <h2>页面权限 · {activeSubsystem}</h2>
          <Can permission={ADMIN.permissions.create}>
            <button type="button" className={styles.btnPrimary} onClick={openCreatePage}>
              新建页面权限
            </button>
          </Can>
        </div>
        <div className={cx(styles.panelBody, styles.panelBodyScroll)}>
          <div className={styles.catalogBanner}>
            <p>
              新建页面时填写<strong>权限码 + path</strong>，可选图标；保存后写入标准路由并加入当前租户侧栏。
              页面组件仍需在 Host <code>route-registry</code>（或子应用）挂载。
            </p>
          </div>
          {currentGroups.length === 0 ? (
            <p className={styles.hint}>该子系统暂无页面权限</p>
          ) : (
            <div className={styles.pageGrid}>
              {currentGroups.map(({ page, actions }) => {
                const catalog = catalogByPermission.get(page.code)
                return (
                  <div key={page.id} className={styles.pageCard}>
                    <div className={styles.pageCardTop}>
                      <div className={styles.pageCardTitle}>
                        <div className={styles.pageCardMeta}>
                          <span className={styles.badgePage}>页面</span>
                          {catalog?.icon ? (
                            <span className={styles.pageCardIcon}>
                              {renderMenuIcon(catalog.icon)}
                            </span>
                          ) : null}
                        </div>
                        <strong>{page.name}</strong>
                        <code className={styles.permCode}>{page.code}</code>
                        {catalog?.path ? (
                          <code className={styles.permCode}>{catalog.path}</code>
                        ) : (
                          <span className={styles.tagMuted}>未绑定 path</span>
                        )}
                      </div>
                      <span className={styles.opCount}>
                        操作 <em>{actions.length}</em>
                      </span>
                    </div>
                    <div className={styles.pageCardFoot}>
                      <span className={styles.tagMuted}>
                        {actions.length ? `${actions.length} 个按钮权限` : '暂无按钮权限'}
                      </span>
                      <div className={styles.pageCardActions}>
                        {canUpdate ? (
                          <button
                            type="button"
                            className={styles.btnLink}
                            onClick={() => openEditPage(page)}
                          >
                            编辑
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={styles.btnLink}
                          onClick={() => openActionEditor(page, actions)}
                        >
                          按钮权限
                        </button>
                        {canDelete ? (
                          <button
                            type="button"
                            className={styles.btnDanger}
                            onClick={() => run(() => deletePermission(page.id), '已删除')}
                          >
                            删除
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </article>

      <Modal
        title={actionModalPage ? `按钮权限 · ${actionModalPage.name}` : '按钮权限'}
        open={actionModalPage != null && !actionFormOpen}
        onCancel={closeActionEditor}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            {canCreate ? (
              <button type="button" className={styles.btnGhost} onClick={openCreateAction}>
                新建操作
              </button>
            ) : (
              <span />
            )}
            <span style={{ display: 'flex', gap: 8 }}>
              <button type="button" className={styles.btnGhost} onClick={closeActionEditor}>
                取消
              </button>
              {canCreate || canUpdate || canDelete ? (
                <button type="button" className={styles.btnPrimary} onClick={persistActionDraft}>
                  保存
                </button>
              ) : null}
            </span>
          </div>
        }
        destroyOnClose
        width={520}
      >
        <p className={styles.hint} style={{ marginBottom: 12 }}>
          下方为待提交列表；点「保存」才会写入数据库。
        </p>
        <ul className={styles.actionCheckList}>
          {draftActions.length === 0 ? (
            <li>
              <span className={styles.hint}>暂无操作权限，可点「新建操作」加入列表</span>
            </li>
          ) : (
            draftActions.map((item) => (
              <li key={item.key}>
                <div className={styles.pageCardFoot} style={{ borderTop: 'none', paddingTop: 0 }}>
                  <label className={styles.permLabel}>
                    <span className={styles.badgeAction}>操作</span>
                    {item.name}
                    <span className={styles.permCode}>{item.code}</span>
                    {item.id == null ? (
                      <span className={styles.tagMuted}>未保存</span>
                    ) : null}
                  </label>
                  <span style={{ display: 'flex', gap: 8 }}>
                    {canUpdate || canCreate ? (
                      <button
                        type="button"
                        className={styles.btnLink}
                        onClick={() => openEditDraft(item)}
                      >
                        编辑
                      </button>
                    ) : null}
                    {canDelete || item.id == null ? (
                      <button
                        type="button"
                        className={styles.btnDanger}
                        onClick={() => removeDraft(item)}
                      >
                        删除
                      </button>
                    ) : null}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      </Modal>

      <Modal
        title={editingPage ? '编辑页面权限' : '新建页面权限'}
        open={pageFormOpen}
        onCancel={() => setPageFormOpen(false)}
        onOk={submitPage}
        okText="保存"
        destroyOnClose
        width={520}
      >
        <p className={styles.formTip}>
          登记<strong>页面权限码 + 路由 path</strong>，可选侧栏图标；保存后同步标准路由并加入当前租户侧栏。
          页面组件仍需在 Host <code>route-registry</code>（或子应用路由）挂载后才能打开。
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
              {
                pattern: /^\//,
                message: '必须以 / 开头',
              },
            ]}
          >
            <Input placeholder="/assets" />
          </Form.Item>
          <Form.Item
            name="icon"
            label="图标"
            extra="非必填；点击图标选中，再点一次取消"
          >
            <IconPicker />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingDraftKey ? '编辑操作权限' : '新建操作权限'}
        open={actionFormOpen}
        onCancel={() => {
          setActionFormOpen(false)
          setEditingDraftKey(null)
        }}
        onOk={async () => {
          try {
            await applyActionToDraft()
          } catch (e) {
            Modal.error({
              title: '无法加入列表',
              content: e instanceof Error ? e.message : '请检查权限码',
            })
          }
        }}
        okText="保存"
        destroyOnClose
      >
        <Form form={actionForm} layout="vertical">
          <Form.Item name="code" label="权限码" rules={[{ required: true }]}>
            <Input
              placeholder="parent:action"
              disabled={Boolean(
                editingDraftKey && draftActions.find((a) => a.key === editingDraftKey)?.id,
              )}
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
