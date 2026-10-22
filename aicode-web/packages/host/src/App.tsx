import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionRoute from '@/components/PermissionRoute'
import { AuthProvider } from '@/context/AuthContext'
import { MenuProvider } from '@/context/MenuContext'
import AdminLayout from '@/layouts/AdminLayout'
import LoginPage from '@/pages/login'
import AppRoutes from '@/router'

export default function App() {
  return (
    <AuthProvider>
      <MenuProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<PermissionRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/*" element={<AppRoutes />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </MenuProvider>
    </AuthProvider>
  )
}
