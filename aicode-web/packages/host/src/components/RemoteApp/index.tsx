import {
  Component,
  lazy,
  Suspense,
  type ComponentType,
  type ReactNode,
} from 'react'
import styles from './index.module.scss'

type RemoteModule = { default: ComponentType }

type Props = {
  name: string
  loader: () => Promise<RemoteModule>
}

type ErrorState = {
  error: Error | null
}

class RemoteErrorBoundary extends Component<
  { name: string; children: ReactNode },
  ErrorState
> {
  state: ErrorState = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className={`${styles.panel} ${styles.error}`}>
          <h2>无法加载「{this.props.name}」</h2>
          <p>
            请确认对应子应用已启动（商品 :5001 / 用户 :5002），且已生成{' '}
            <code className={styles.code}>remoteEntry.js</code>。
          </p>
          <pre>{this.state.error.message}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

export default function RemoteApp({ name, loader }: Props) {
  const LazyRemote = lazy(loader)

  return (
    <RemoteErrorBoundary name={name}>
      <Suspense
        fallback={
          <div className={`${styles.panel} ${styles.loading}`}>
            正在从远程加载「{name}」…
          </div>
        }
      >
        <LazyRemote />
      </Suspense>
    </RemoteErrorBoundary>
  )
}
