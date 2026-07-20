// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Toast
// Single ephemeral notification with icon + message + dismiss.
// ═══════════════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react'
import type { Toast as ToastData } from '../../types'
import styles from './Toast.module.css'

interface ToastProps {
  toast: ToastData
  onDismiss: (id: string) => void
}

const ICONS: Record<string, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
}

export default function Toast({ toast, onDismiss }: ToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  // Auto-dismiss
  useEffect(() => {
    const ms = toast.durationMs ?? 3000
    timerRef.current = setTimeout(() => onDismiss(toast.id), ms)
    return () => clearTimeout(timerRef.current)
  }, [toast.id, toast.durationMs, onDismiss])

  return (
    <div
      className={`${styles.toast} ${styles[toast.type]}`}
      role="status"
      aria-live="polite"
    >
      <span className={styles.icon} aria-hidden="true">
        {ICONS[toast.type] ?? ICONS.info}
      </span>
      <span className={styles.message}>{toast.message}</span>
      <button
        className={styles.dismiss}
        onClick={() => onDismiss(toast.id)}
        aria-label="关闭通知"
      >
        ✕
      </button>
    </div>
  )
}
