import { Button, Form, Input, InputNumber, Select } from 'antd'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createProduct,
  getProductById,
  getProductCategories,
  updateProduct,
} from '@/api/product'
import type { ProductCategory } from '@/types/product'
import styles from '@/styles/page.module.scss'

type FormValues = {
  name: string
  sku: string
  price: number
  stock: number
  status: 'on' | 'off'
  categoryId?: string
}

export default function ProductForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const [form] = Form.useForm<FormValues>()
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getProductCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (!id) {
      form.setFieldsValue({ stock: 0, status: 'on' })
      return
    }
    getProductById(id)
      .then((product) =>
        form.setFieldsValue({
          name: product.name,
          sku: product.sku,
          price: product.price,
          stock: product.stock,
          status: product.status,
          categoryId: product.categoryId ? String(product.categoryId) : undefined,
        }),
      )
      .catch((err: Error) => setError(err.message || '商品加载失败'))
  }, [form, id])

  async function onFinish(values: FormValues) {
    setSubmitting(true)
    setError(null)
    const payload = {
      name: values.name,
      sku: values.sku,
      price: Number(values.price),
      stock: Number(values.stock),
      status: values.status === 'off' ? ('off' as const) : ('on' as const),
      categoryId: values.categoryId ? Number(values.categoryId) : null,
    }
    try {
      if (editing && id) await updateProduct(Number(id), payload)
      else await createProduct(payload)
      navigate('..')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1>{editing ? '编辑商品' : '新建商品'}</h1>
          <p>提交后写入当前租户的真实商品表</p>
        </div>
        <Link className={styles.btn} to="..">
          取消
        </Link>
      </div>

      <Form
        form={form}
        layout="vertical"
        className={`${styles.card} ${styles.formGrid}`}
        colon={false}
        onFinish={onFinish}
        requiredMark
      >
        <Form.Item name="name" label="商品名称" rules={[{ required: true, message: '请输入商品名称' }]}>
          <Input placeholder="例如：无线鼠标" />
        </Form.Item>
        <Form.Item name="sku" label="SKU" rules={[{ required: true, message: '请输入 SKU' }]}>
          <Input placeholder="SKU-1005" />
        </Form.Item>
        <Form.Item name="categoryId" label="分类">
          <Select
            allowClear
            placeholder="未分类"
            options={categories.map((category) => ({
              value: String(category.id),
              label: category.name,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="price"
          label="价格"
          rules={[{ required: true, message: '请输入价格' }]}
        >
          <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} placeholder="0.00" />
        </Form.Item>
        <Form.Item
          name="stock"
          label="库存"
          rules={[{ required: true, message: '请输入库存' }]}
        >
          <InputNumber min={0} precision={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
          <Select
            options={[
              { value: 'on', label: '上架' },
              { value: 'off', label: '下架' },
            ]}
          />
        </Form.Item>
        {error ? <p className={styles.formError}>{error}</p> : null}
        <div className={styles.formActions}>
          <Button type="primary" htmlType="submit" loading={submitting}>
            保存
          </Button>
        </div>
      </Form>
    </section>
  )
}
