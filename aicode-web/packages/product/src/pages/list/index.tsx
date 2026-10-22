import { hasPermission } from '@aicode/shared/auth'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteProduct, getProductList } from '@/api/product'
import { PRODUCT } from '@/permissions'
import type { Product } from '@/types/product'
import styles from '@/styles/page.module.scss'

export default function ProductList() {
  const [keyword, setKeyword] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const canCreate = hasPermission(PRODUCT.create)
  const canUpdate = hasPermission(PRODUCT.update)
  const canDelete = hasPermission(PRODUCT.delete)

  function load() {
    setLoading(true)
    getProductList()
      .then(setProducts)
      .catch((err: Error) => setError(err.message || '商品加载失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const list = useMemo(
    () =>
      products.filter(
        (p) =>
          p.name.includes(keyword.trim()) ||
          p.sku.toLowerCase().includes(keyword.trim().toLowerCase()),
      ),
    [keyword, products],
  )

  async function onDelete(item: Product) {
    if (!window.confirm(`确定删除「${item.name}」？`)) return
    try {
      await deleteProduct(item.id)
      setProducts((current) => current.filter((row) => row.id !== item.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1>商品列表</h1>
        </div>
      </div>

      <article className={`${styles.card} ${styles.panel}`}>
        <div className={styles.panelHead}>
          <h2>商品数据</h2>
          <div className={styles.panelTools}>
            <label className={styles.searchInline}>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索商品名称 / SKU"
              />
            </label>
            <span className={styles.meta}>共 {list.length} 条</span>
            {canCreate ? (
              <Link className={`${styles.btn} ${styles.primary}`} to="create">
                新建商品
              </Link>
            ) : null}
          </div>
        </div>
        <div className={styles.panelBody}>
          {loading ? <p className={styles.empty}>正在加载…</p> : null}
          {error ? <p className={styles.bannerError}>{error}</p> : null}
          {!loading ? (
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>商品</th>
              <th>SKU</th>
              <th>价格</th>
              <th>库存</th>
              <th>状态</th>
              <th className={styles.colActions}>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className={styles.nameCell}>
                    <span className={styles.thumb}>{item.name.slice(0, 1)}</span>
                    <strong>{item.name}</strong>
                  </div>
                </td>
                <td className={styles.mono}>{item.sku}</td>
                <td className={styles.price}>¥{item.price.toLocaleString()}</td>
                <td>{item.stock}</td>
                <td>
                  <span
                    className={`${styles.tag} ${item.status === 'on' ? styles.on : styles.off}`}
                  >
                    {item.status === 'on' ? '上架' : '下架'}
                  </span>
                </td>
                <td className={styles.colActions}>
                  <div className={styles.rowActions}>
                    <Link className={styles.linkBtn} to={`detail/${item.id}`}>
                      详情
                    </Link>
                    {canUpdate ? (
                      <>
                        <span className={styles.actionSep} />
                        <Link className={styles.linkBtn} to={`edit/${item.id}`}>
                          编辑
                        </Link>
                      </>
                    ) : null}
                    {canDelete ? (
                      <>
                        <span className={styles.actionSep} />
                        <button
                          type="button"
                          className={`${styles.linkBtn} ${styles.linkDanger}`}
                          onClick={() => onDelete(item)}
                        >
                          删除
                        </button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.empty}>
                  暂无匹配商品
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
          ) : null}
        </div>
      </article>
    </section>
  )
}
