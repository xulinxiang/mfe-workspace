import { Link } from 'react-router-dom'
import styles from './index.module.scss'

export function ForbiddenPage() {
  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <p className={styles.code}>403</p>
        <h1>无权访问</h1>
        <p>当前角色没有此页面需要的权限。</p>
        <Link className={styles.link} to="/">
          返回工作台
        </Link>
      </div>
    </section>
  )
}

export function NotFoundPage() {
  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <p className={styles.code}>404</p>
        <h1>页面不存在</h1>
        <p>路由未注册，或对应微前端没有该页面。</p>
        <Link className={styles.link} to="/">
          返回工作台
        </Link>
      </div>
    </section>
  )
}
