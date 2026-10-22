import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from '@/App'
import StandaloneLayout from '@/layouts/StandaloneLayout'
import '@/layouts/StandaloneLayout/global.scss'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <StandaloneLayout>
        <App />
      </StandaloneLayout>
    </BrowserRouter>
  </React.StrictMode>,
)
