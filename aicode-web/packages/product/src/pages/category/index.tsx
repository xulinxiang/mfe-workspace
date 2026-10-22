import { hasPermission } from '@aicode/shared/auth'
import { FormEvent, useEffect, useState } from 'react'
import {
  createProductCategory,
  deleteProductCategory,
  getProductCategories,
  updateProductCategory,
} from '@/api/product'
import FormModal from '@/components/FormModal'
import { PRODUCT } from '@/permissions'
import type { ProductCategory } from '@/types/product'
import styles from '@/styles/page.module.scss'

type Draft = { name: string; status: 'on' | 'off' }

const emptyDraft: Draft = { name: '', status: 'on' }

export default function ProductCategoryPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editing, setEditing] = useState<ProductCategory | 'create' | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const canCreate = hasPermission(PRODUCT.categoryCreate)
  const canUpdate = hasPermission(PRODUCT.categoryUpdate)
  const canDelete = hasPermission(PRODUCT.categoryDelete)
  const creating = editing === 'create'

  function load() {
    getProductCategories()
      .then(setCategories)
      .catch((err: Error) => setLoadError(err.message || '分类加载失败'))
  }

  useEffect(() => {
    load()
  }, [])

  function closeModal() {
    if (submitting) return
    setEditing(null)
    setFormError(null)
  }

  function openCreate() {
    setDraft(emptyDraft)
    setFormError(null)
    setEditing('create')
  }

  function openEdit(row: ProductCategory) {
    setDraft({ name: row.name, status: row.status })
    setFormError(null)
    setEditing(row)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setFormError(null)
    try {
      if (editing === 'create') await createProductCategory(draft)
      else if (editing) await updateProductCategory(editing.id, draft)
      setEditing(null)
      load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete(row: ProductCategory) {
    if (!window.confirm(`确定删除分类「${row.name}」？`)) return
    try {
      await deleteProductCategory(row.id)
      load()
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : '删除失败')
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1>商品分类</h1>
        </div>
      </div>

      <article className={`${styles.card} ${styles.panel}`}>
        <div className={styles.panelHead}>
          <h2>分类列表</h2>
          <div className={styles.panelTools}>
            {canCreate ? (
              <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={openCreate}>
                新建分类
              </button>
            ) : null}
          </div>
        </div>
        <div className={styles.panelBody}>
          {loadError ? <p className={styles.bannerError}>{loadError}</p> : null}
          {categories.length === 0 && !loadError ? (
            <p className={styles.empty}>暂无分类</p>
          ) : (
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>分类名称</th>
                  <th className={styles.colNarrow}>商品数</th>
                  <th className={styles.colNarrow}>状态</th>
                  {canUpdate || canDelete ? (
                    <th className={styles.colActions}>操作</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td className={styles.colNarrow}>{category.productCount}</td>
                    <td className={styles.colNarrow}>
                      <span
                        className={`${styles.tag} ${
                          category.status === 'on' ? styles.on : styles.off
                        }`}
                      >
                        {category.status === 'on' ? '启用' : '停用'}
                      </span>
                    </td>
                    {canUpdate || canDelete ? (
                      <td className={styles.colActions}>
                        <div className={styles.rowActions}>
                          {canUpdate ? (
                            <button
                              type="button"
                              className={styles.linkBtn}
                              onClick={() => openEdit(category)}
                            >
                              编辑
                            </button>
                          ) : null}
                          {canUpdate && canDelete ? <span className={styles.actionSep} /> : null}
                          {canDelete ? (
                            <button
                              type="button"
                              className={`${styles.linkBtn} ${styles.linkDanger}`}
                              onClick={() => onDelete(category)}
                            >
                              删除
                            </button>
                          ) : null}
                          {!canUpdate && !canDelete ? <span className={styles.meta}>只读</span> : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </article>

      <FormModal
        open={editing != null}
        title={creating ? '新建分类' : `编辑分类 · ${editing && editing !== 'create' ? editing.name : ''}`}
        onClose={closeModal}
        onSubmit={onSubmit}
        submitting={submitting}
        submitLabel={creating ? '创建' : '保存'}
        error={formError}
      >
        <label className={styles.field}>
          <span>分类名称</span>
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="例如：数码配件"
            required
            autoFocus
          />
        </label>
        <label className={styles.field}>
          <span>状态</span>
          <select
            value={draft.status}
            onChange={(e) =>
              setDraft({ ...draft, status: e.target.value === 'off' ? 'off' : 'on' })
            }
          >
            <option value="on">启用</option>
            <option value="off">停用</option>
          </select>
        </label>
      </FormModal>
    </section>
  )
}
