import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createProduct } from '@/api/product'
import styles from '@/styles/page.module.scss'

export default function ProductCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    sku: '',
    price: '',
    stock: '0',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await createProduct({
        name: form.name,
        sku: form.sku,
        price: Number(form.price),
        stock: Number(form.stock),
        status: 'on',
      })
      navigate('..')
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1>新建商品</h1>
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
        {error ? <p>{error}</p> : null}
        <div>
          <button
            type="submit"
            disabled={submitting}
            className={`${styles.btn} ${styles.primary}`}
          >
            {submitting ? '提交中…' : '提交'}
          </button>
        </div>
      </form>
    </section>
  )
}
