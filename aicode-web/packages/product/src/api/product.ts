import { apiRequest } from '@aicode/shared/api'
import type { Product, ProductCategory, ProductPayload } from '@/types/product'

export type { ProductCategory, ProductPayload }

export function getProductList() {
  return apiRequest<Product[]>('/api/products')
}

export function getProductById(id: string | number) {
  return apiRequest<Product>(`/api/products/${id}`)
}

export function createProduct(payload: ProductPayload) {
  return apiRequest<Product>('/api/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateProduct(id: number, payload: ProductPayload) {
  return apiRequest<Product>(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteProduct(id: number) {
  return apiRequest<null>(`/api/products/${id}`, { method: 'DELETE' })
}

export function getProductCategories() {
  return apiRequest<ProductCategory[]>('/api/product-categories')
}

export function createProductCategory(payload: Pick<ProductCategory, 'name' | 'status'>) {
  return apiRequest<ProductCategory>('/api/product-categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateProductCategory(
  id: number,
  payload: Pick<ProductCategory, 'name' | 'status'>,
) {
  return apiRequest<ProductCategory>(`/api/product-categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteProductCategory(id: number) {
  return apiRequest<null>(`/api/product-categories/${id}`, { method: 'DELETE' })
}
