import { apiRequest } from '@aicode/shared/api'
import type { Product } from '@/types/product'

export type ProductCategory = {
  id: number
  name: string
  status: 'on' | 'off'
  productCount: number
}

export type CreateProductPayload = {
  name: string
  sku: string
  price: number
  stock: number
  status: 'on' | 'off'
}

export function getProductList() {
  return apiRequest<Product[]>('/api/products')
}

export function getProductById(id: string) {
  return apiRequest<Product>(`/api/products/${id}`)
}

export function createProduct(payload: CreateProductPayload) {
  return apiRequest<Product>('/api/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getProductCategories() {
  return apiRequest<ProductCategory[]>('/api/product-categories')
}
