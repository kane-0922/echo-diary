// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Toast Container
// Renders all active toasts in a fixed overlay.
// ═══════════════════════════════════════════════════════════════════════

import { useApp } from '../../contexts/AppContext'
import Toast from './Toast'
import styles from './Toast.module.css'

export default function ToastContainer() {
  const { state, actions } = useApp()

  if (state.toasts.length === 0) return null

  return (
    <div className={styles.container} aria-label="通知列表">
      {state.toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={actions.dismissToast}
        />
      ))}
    </div>
  )
}
