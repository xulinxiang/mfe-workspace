import type { ReactNode } from 'react'
import styles from './admin.module.scss'

type Stat = { label: string; value: string | number }

type Props = {
  title: string
  description?: string
  stats?: Stat[]
  loading?: boolean
  children: ReactNode
}

export default function AdminPageShell({ title, description, stats, loading, children }: Props) {
  if (loading) {
    return <p className={styles.loading}>加载中…</p>
  }

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1>{title}</h1>
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
