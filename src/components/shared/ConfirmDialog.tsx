// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Confirm Dialog
// Reusable destructive-action confirmation modal.
// ═══════════════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react'
import styles from './ConfirmDialog.module.css'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null)

  // Focus trap: focus confirm button on open
  useEffect(() => {
    if (open) {
      confirmBtnRef.current?.focus()
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className={styles.backdrop}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title} id="confirm-dialog-title">
            {title}
          </h3>
        </div>
        <div className={styles.body}>
          <p className={styles.message}>{message}</p>
        </div>
        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            className={variant === 'danger' ? styles.btnDanger : styles.btnConfirm}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
