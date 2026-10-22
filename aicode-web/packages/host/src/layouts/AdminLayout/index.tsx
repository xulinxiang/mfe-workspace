import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useMenus } from '@/context/MenuContext'
import SideMenu from './SideMenu'
import styles from './index.module.scss'

export default function AdminLayout() {
  const { pathname } = useLocation()
  const { titleForPath } = useMenus()
  const current = titleForPath(pathname)
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  const initial = session?.name?.slice(0, 1) ?? 'U'

  function onLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>运</span>
          <div>
            <strong>运营中台</strong>
            <p>{session?.tenantName ?? 'Micro Frontend'}</p>
          </div>
        </div>

        <SideMenu />

        <div className={styles.foot}>
          <div className={styles.userMini}>
            <span className={styles.avatar}>{initial}</span>
            <div>
              <strong>{session?.name ?? '—'}</strong>
              <p>{session?.tenantCode ?? '—'}</p>
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
            <span className={styles.envTag}>开发环境</span>
            <div className={styles.headerUser}>
              <span className={styles.avatar}>{initial}</span>
              <span>{session?.email}</span>
            </div>
            <button type="button" className={styles.logoutBtn} onClick={onLogout}>
              退出
            </button>
          </div>
        </header>
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
