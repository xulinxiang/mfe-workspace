import 'antd/dist/reset.css'
import { App, ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { ProConfigProvider } from '@ant-design/pro-components'
import type { ReactNode } from 'react'

/**
 * 可选：仅在某个页面要用 Pro 组件时再包一层，不要挂在 Host 全局 main.tsx。
 */
export function AppProProvider({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      <ProConfigProvider hashed={false}>
        <App>{children}</App>
      </ProConfigProvider>
    </ConfigProvider>
  )
}
