export type Product = {
  id: number
  name: string
  sku: string
  price: number
  stock: number
  status: 'on' | 'off'
  categoryId?: number | null
}

export type ProductCategory = {
  id: number
  name: string
  status: 'on' | 'off'
  productCount: number
}

export type ProductPayload = {
  name: string
  sku: string
  price: number
  stock: number
  status: 'on' | 'off'
  categoryId?: number | null
}
