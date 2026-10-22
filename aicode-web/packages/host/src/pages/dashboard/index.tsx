import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchDashboardStats, type DashboardStats } from '@/api/dashboard'
import styles from './index.module.scss'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchDashboardStats()
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || '加载失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1>工作台</h1>
          <p>今日概览 · 数据来自 aicode-platform 接口</p>
        </div>
      </div>

      {error ? <p className={styles.errorBanner}>{error}</p> : null}

      <div className={styles.stats}>
        <article className={styles.stat}>
          <p>接入子应用</p>
          <strong>{loading ? '—' : (stats?.remotes ?? 0)}</strong>
          <span>product / user</span>
        </article>
        <article className={styles.stat}>
          <p>今日订单</p>
          <strong>{loading ? '—' : (stats?.orders ?? 0)}</strong>
          <span>租户维度</span>
        </article>
        <article className={styles.stat}>
          <p>待处理</p>
          <strong>{loading ? '—' : (stats?.pending ?? 0)}</strong>
          <span>需人工跟进</span>
        </article>
        <article className={styles.stat}>
          <p>活跃用户</p>
          <strong>{loading ? '—' : (stats?.users ?? '—')}</strong>
          <span>近 7 日</span>
        </article>
      </div>

      <div className={styles.grid}>
        <article className={styles.panel}>
          <h3>开发方式</h3>
          <ul className={styles.list}>
            <li>
              <b>联调提测</b>
              <span>打开 :5000，登录后使用左侧菜单</span>
            </li>
            <li>
              <b>子系统开发</b>
              <span>单独打开 :5001 / :5002，使用假壳</span>
            </li>
          </ul>
        </article>
        <article className={styles.panel}>
          <h3>快捷入口</h3>
          <div className={styles.links}>
            <Link className={styles.link} to="/product">
              商品列表 →
            </Link>
            <Link className={styles.link} to="/user">
              用户中心 →
            </Link>
          </div>
        </article>
      </div>
    </section>
  )
}
