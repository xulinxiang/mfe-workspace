import type { ReactNode } from 'react'
import { cx } from '@/utils/cx'
import styles from './index.module.scss'

type Props = {
  children: ReactNode
}

export default function StandaloneLayout({ children }: Props) {
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
          <button type="button" className={cx(styles.item, styles.active)}>
            <i className={styles.icon} aria-hidden />
            <span>用户中心</span>
          </button>
          <button type="button" className={cx(styles.item, styles.disabled)} disabled>
            <i className={styles.icon} aria-hidden />
            <span>商品列表</span>
          </button>
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
            <strong>用户中心</strong>
          </div>
          <div className={styles.actions}>
            <span className={styles.warn}>Standalone</span>
            <div className={styles.headerUser}>
              <span className={styles.avatar}>D</span>
              <span>demo@company.com</span>
            </div>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  )
}
