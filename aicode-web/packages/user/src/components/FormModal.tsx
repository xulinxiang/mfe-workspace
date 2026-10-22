import type { FormEvent, ReactNode } from 'react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from '@/styles/page.module.scss'

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
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className={styles.modalOverlay}
      role="presentation"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <div
        className={styles.modalDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h3 id="form-modal-title">{title}</h3>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <form className={styles.modalForm} onSubmit={onSubmit} autoComplete="off">
          {children}
          {error ? <p className={styles.formError}>{error}</p> : null}
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btn} onClick={onClose} disabled={submitting}>
              取消
            </button>
            <button type="submit" disabled={submitting} className={`${styles.btn} ${styles.primary}`}>
              {submitting ? '保存中…' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
