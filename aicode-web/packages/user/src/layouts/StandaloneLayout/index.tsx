import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cx } from '@/utils/cx'
import StandaloneAuthGate, { useStandaloneSession } from './StandaloneAuthGate'
import styles from './index.module.scss'

const LOCAL_MENU = [
  { to: '/', label: '用户列表', end: true },
  { to: '/profile', label: '个人资料', end: true },
] as const

type Props = {
  children: ReactNode
}

export default function StandaloneLayout({ children }: Props) {
  const { pathname } = useLocation()
  const { session } = useStandaloneSession()
  const initial = session?.name?.slice(0, 1) ?? '—'
  const current =
    LOCAL_MENU.find((m) => (m.end ? pathname === m.to : pathname.startsWith(m.to)))?.label ??
    '页面'

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>用</span>
          <div>
            <strong>运营中台</strong>
            <p>用户子系统 · 假壳</p>
          </div>
        </div>

        <nav className={styles.nav}>
          <p className={styles.navGroup}>本域菜单（本地）</p>
          {LOCAL_MENU.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cx(styles.item, isActive && styles.active)}
            >
              <i className={styles.icon} aria-hidden />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.foot}>
          <div className={styles.userMini}>
            <span className={styles.avatar}>开</span>
            <div>
              <strong>本地开发</strong>
              <p>不上生产 · :5002</p>
            </div>
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.crumb}>
            <span>首页</span>
            <i>/</i>
            <strong>{current}</strong>
          </div>
          <div className={styles.actions}>
            <span className={styles.warn}>Standalone</span>
            <div className={styles.headerUser}>
              <span className={styles.avatar}>{initial}</span>
              <span>{session?.email ?? '未登录'}</span>
            </div>
          </div>
        </header>
        <main className={styles.content}>
          <StandaloneAuthGate>{children}</StandaloneAuthGate>
        </main>
      </div>
    </div>
  )
}
