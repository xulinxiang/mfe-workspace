import { Route, Routes } from 'react-router-dom'
import UserList from '@/pages/list'
import Profile from '@/pages/profile'

export default function AppRoutes() {
  return (
    <Routes>
      <Route index element={<UserList />} />
      <Route path="profile" element={<Profile />} />
    </Routes>
  )
}
