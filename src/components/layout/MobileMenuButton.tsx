// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Mobile Menu Button (Hamburger)
// Visible only below 1024px. Animates between hamburger and close (X).
// ═══════════════════════════════════════════════════════════════════════

import { useApp } from '../../contexts/AppContext'
import styles from './MobileMenuButton.module.css'

export default function MobileMenuButton() {
  const { state, actions } = useApp()
  const isOpen = state.sidebarOpen

  return (
    <button
      className={`${styles.hamburger} ${isOpen ? styles.open : ''}`}
      onClick={() => actions.toggleSidebar()}
      aria-label={isOpen ? '关闭侧边栏' : '打开侧边栏'}
      aria-expanded={isOpen}
      title={isOpen ? '关闭侧边栏' : '打开侧边栏'}
    >
      <span className={styles.line} />
      <span className={styles.line} />
      <span className={styles.line} />
    </button>
  )
}
