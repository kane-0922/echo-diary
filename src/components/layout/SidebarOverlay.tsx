// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Sidebar Overlay
// Click-through backdrop that closes the mobile drawer.
// ═══════════════════════════════════════════════════════════════════════

import { useApp } from '../../contexts/AppContext'
import styles from './SidebarOverlay.module.css'

export default function SidebarOverlay() {
  const { state, actions } = useApp()
  const isOpen = state.sidebarOpen

  return (
    <div
      className={`${styles.overlay} ${isOpen ? styles.visible : ''}`}
      onClick={() => actions.toggleSidebar(false)}
      aria-hidden="true"
    />
  )
}
