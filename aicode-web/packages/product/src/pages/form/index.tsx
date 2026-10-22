import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createProduct,
  getProductById,
  getProductCategories,
  updateProduct,
} from '@/api/product'
import type { ProductCategory } from '@/types/product'
import styles from '@/styles/page.module.scss'

export default function ProductForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    sku: '',
    price: '',
    stock: '0',
    status: 'on',
    categoryId: '',
  })
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getProductCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (!id) return
    getProductById(id)
      .then((product) =>
        setForm({
          name: product.name,
          sku: product.sku,
          price: String(product.price),
          stock: String(product.stock),
          status: product.status,
          categoryId: product.categoryId ? String(product.categoryId) : '',
        }),
      )
      .catch((err: Error) => setError(err.message || '商品加载失败'))
  }, [id])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const payload = {
      name: form.name,
      sku: form.sku,
      price: Number(form.price),
      stock: Number(form.stock),
      status: form.status === 'off' ? ('off' as const) : ('on' as const),
      categoryId: form.categoryId ? Number(form.categoryId) : null,
    }
    try {
      if (editing && id) await updateProduct(Number(id), payload)
      else await createProduct(payload)
      navigate('..')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1>{editing ? '编辑商品' : '新建商品'}</h1>
          <p>提交后写入当前租户的真实商品表</p>
        </div>
        <Link className={styles.btn} to="..">
          取消
        </Link>
      </div>

      <form className={`${styles.card} ${styles.form}`} onSubmit={onSubmit}>
        <label>
          <span>商品名称</span>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="例如：无线鼠标"
            required
          />
        </label>
        <label>
          <span>SKU</span>
          <input
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            placeholder="SKU-1005"
            required
          />
        </label>
        <label>
          <span>分类</span>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            <option value="">未分类</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>价格</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="0.00"
            required
          />
        </label>
        <label>
          <span>库存</span>
          <input
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            required
          />
        </label>
        <label>
          <span>状态</span>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="on">上架</option>
            <option value="off">下架</option>
          </select>
        </label>
        {error ? <p className={styles.formError}>{error}</p> : null}
        <div className={styles.formActions}>
          <button
            type="submit"
            disabled={submitting}
            className={`${styles.btn} ${styles.primary}`}
          >
            {submitting ? '提交中…' : '保存'}
          </button>
        </div>
      </form>
    </section>
  )
}
