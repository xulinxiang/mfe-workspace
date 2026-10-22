import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'
import StandaloneLayout from '@/layouts/StandaloneLayout'
import '@/layouts/StandaloneLayout/global.scss'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StandaloneLayout>
      <App />
    </StandaloneLayout>
  </React.StrictMode>,
)
