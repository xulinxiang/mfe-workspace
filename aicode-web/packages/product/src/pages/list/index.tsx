import { hasPermission } from '@aicode/shared/auth'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProductList } from '@/api/product'
import type { Product } from '@/types/product'
import styles from '@/styles/page.module.scss'

export default function ProductList() {
  const [keyword, setKeyword] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getProductList()
      .then(setProducts)
      .catch((err: Error) => setError(err.message || '商品加载失败'))
      .finally(() => setLoading(false))
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

  return (
    <section className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1>商品列表</h1>
          <p>
            路由：<code className={styles.code}>/</code>
            （挂到 Host 时是 <code className={styles.code}>/product</code>）
          </p>
        </div>
        {hasPermission('product:create') ? (
          <Link className={`${styles.btn} ${styles.primary}`} to="create">
            + 新建商品
          </Link>
        ) : null}
      </div>

      <div className={`${styles.toolbar} ${styles.card}`}>
        <label className={styles.search}>
          <span>搜索</span>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="商品名称 / SKU"
          />
        </label>
        <div className={styles.meta}>
          共 <b>{list.length}</b> 条
        </div>
      </div>

      <div className={`${styles.card} ${styles.tableCard}`}>
        {loading ? <p className={styles.empty}>正在加载真实商品数据…</p> : null}
        {error ? <p className={styles.empty}>{error}</p> : null}
        <table>
          <thead>
            <tr>
              <th>商品</th>
              <th>SKU</th>
              <th>价格</th>
              <th>库存</th>
              <th>状态</th>
              <th>操作</th>
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
                <td>
                  <Link className={styles.link} to={`detail/${item.id}`}>
                    详情
                  </Link>
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
      </div>
    </section>
  )
}
