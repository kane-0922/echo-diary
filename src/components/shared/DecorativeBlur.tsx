// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Decorative Blur Circles
// Soft ambient blurs in the page background for visual warmth.
// ═══════════════════════════════════════════════════════════════════════

import styles from './DecorativeBlur.module.css'

export default function DecorativeBlur() {
  return (
    <div className={styles.wrapper} aria-hidden="true">
      <div className={styles.orange} />
      <div className={styles.green} />
    </div>
  )
}
