import { useMenus } from '@/context/MenuContext'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import styles from './admin.module.scss'

type Stat = { label: string; value: string | number }

type Props = {
  /** 菜单未匹配到时的兜底标题 */
  title?: string
  description?: string
  stats?: Stat[]
  loading?: boolean
  children: ReactNode
}

export default function AdminPageShell({ title, description, stats, loading, children }: Props) {
  const { pathname } = useLocation()
  const { titleForPath } = useMenus()
  const menuTitle = titleForPath(pathname)
  const heading = menuTitle && menuTitle !== '页面' ? menuTitle : title ?? menuTitle

  if (loading) {
    return <p className={styles.loading}>加载中…</p>
  }

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1>{heading}</h1>
          {description ? <p>{description}</p> : null}
        </div>
      </header>
      {stats?.length ? (
        <div className={styles.stats}>
          {stats.map((s) => (
            <article key={s.label} className={styles.stat}>
              <p className={styles.statLabel}>{s.label}</p>
              <strong className={styles.statValue}>{s.value}</strong>
            </article>
          ))}
        </div>
      ) : null}
      {children}
    </section>
  )
}
