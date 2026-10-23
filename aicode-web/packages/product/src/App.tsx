import { AppProProvider } from '@aicode/pro-ui'
import AppRoutes from '@/router'
import styles from '@/styles/app.module.scss'

export default function App() {
  return (
    <AppProProvider>
      <div className={styles.root}>
        <AppRoutes />
      </div>
    </AppProProvider>
  )
}
