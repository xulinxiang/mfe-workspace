import { Alert, Modal } from 'antd'
import type { FormEvent, ReactNode } from 'react'

const FORM_ID = 'aicode-user-form-modal'

type Props = {
  open: boolean
  title: string
  onClose: () => void
  onSubmit: (event: FormEvent) => void
  submitting?: boolean
  submitLabel?: string
  children: ReactNode
  error?: string | null
}

export default function FormModal({
  open,
  title,
  onClose,
  onSubmit,
  submitting = false,
  submitLabel = '保存',
  children,
  error,
}: Props) {
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      onOk={() => document.getElementById(FORM_ID)?.requestSubmit()}
      okText={submitLabel}
      cancelText="取消"
      confirmLoading={submitting}
      destroyOnClose
      width={480}
      maskClosable={!submitting}
      getContainer={() => document.body}
    >
      {error ? (
        <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />
      ) : null}
      <form id={FORM_ID} onSubmit={onSubmit} autoComplete="off">
        {children}
      </form>
    </Modal>
  )
}
