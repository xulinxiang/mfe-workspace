import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProductById } from '@/api/product'
import type { Product } from '@/types/product'
import styles from '@/styles/page.module.scss'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('商品参数错误')
      setLoading(false)
      return
    }
    getProductById(id)
      .then(setProduct)
      .catch((err: Error) => setError(err.message || '商品加载失败'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <section className={styles.page}>正在加载真实商品数据…</section>
  }

  if (!product) {
    return (
      <section className={styles.page}>
        <div className={styles.head}>
          <div>
            <h1>{error ?? '商品不存在'}</h1>
            <p>id = {id}</p>
          </div>
          <Link className={styles.btn} to="..">
            返回列表
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1>{product.name}</h1>
          <p>
            路由：<code className={styles.code}>/detail/:id</code> · 当前 id ={' '}
            {product.id}
          </p>
        </div>
        <Link className={styles.btn} to="..">
          返回列表
        </Link>
      </div>

      <div className={`${styles.card} ${styles.detail}`}>
        <dl>
          <div>
            <dt>SKU</dt>
            <dd className={styles.mono}>{product.sku}</dd>
          </div>
          <div>
            <dt>价格</dt>
            <dd className={styles.price}>¥{product.price.toLocaleString()}</dd>
          </div>
          <div>
            <dt>库存</dt>
            <dd>{product.stock}</dd>
          </div>
          <div>
            <dt>状态</dt>
            <dd>
              <span
                className={`${styles.tag} ${product.status === 'on' ? styles.on : styles.off}`}
              >
                {product.status === 'on' ? '上架' : '下架'}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
