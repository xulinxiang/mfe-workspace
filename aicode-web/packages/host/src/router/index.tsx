import { Route, Routes } from 'react-router-dom'
import RemoteApp from '@/components/RemoteApp'
import { routeRegistry } from '@/config/route-registry'
import { ForbiddenPage, NotFoundPage } from '@/pages/status'

export default function AppRoutes() {
  return (
    <Routes>
      {routeRegistry.map((route) => {
        const LocalComponent = route.component
        const element =
          LocalComponent && !route.loader ? (
            <LocalComponent />
          ) : route.loader ? (
            <RemoteApp name={route.name} loader={route.loader} />
          ) : null
        return <Route key={route.key} path={route.path} element={element} />
      })}
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
