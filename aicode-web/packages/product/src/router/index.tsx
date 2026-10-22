import { Route, Routes } from 'react-router-dom'
import Category from '@/pages/category'
import Detail from '@/pages/detail'
import Form from '@/pages/form'
import List from '@/pages/list'

export default function AppRoutes() {
  return (
    <Routes>
      <Route index element={<List />} />
      <Route path="category" element={<Category />} />
      <Route path="detail/:id" element={<Detail />} />
      <Route path="create" element={<Form />} />
      <Route path="edit/:id" element={<Form />} />
    </Routes>
  )
}
