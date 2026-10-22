import { useEffect, useState } from 'react'
import {
  getProductCategories,
  type ProductCategory as ProductCategoryType,
} from '@/api/product'
import styles from '@/styles/page.module.scss'

export default function ProductCategory() {
  const [categories, setCategories] = useState<ProductCategoryType[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getProductCategories()
      .then(setCategories)
      .catch((err: Error) => setError(err.message || '分类加载失败'))
  }, [])

  return (
    <section className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1>商品分类</h1>
          <p>数据来自当前租户的商品分类表</p>
        </div>
      </div>
      <div className={`${styles.card} ${styles.tableCard}`}>
        <table>
          <thead>
            <tr>
              <th>分类</th>
              <th>商品数</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>{category.productCount}</td>
                <td>
                  <span
                    className={`${styles.tag} ${
                      category.status === 'on' ? styles.on : styles.off
                    }`}
                  >
                    {category.status === 'on' ? '启用' : '停用'}
                  </span>
                </td>
              </tr>
            ))}
            {error ? (
              <tr>
                <td colSpan={3} className={styles.empty}>
                  {error}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}
