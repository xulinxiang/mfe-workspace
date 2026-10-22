import { Route, Routes } from 'react-router-dom'
import Category from '@/pages/category'
import Create from '@/pages/create'
import Detail from '@/pages/detail'
import List from '@/pages/list'

/**
 * 子应用路由。
 * 本地：/、/category …
 * 挂 Host：接在 /product/* 后面
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route index element={<List />} />
      <Route path="category" element={<Category />} />
      <Route path="detail/:id" element={<Detail />} />
      <Route path="create" element={<Create />} />
    </Routes>
  )
}
