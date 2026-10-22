import AppRoutes from '@/router'
import styles from '@/styles/app.module.scss'

export default function App() {
  return (
    <div className={styles.root}>
      <AppRoutes />
    </div>
  )
}
