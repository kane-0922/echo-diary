// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Empty State
// Friendly placeholder when there's nothing to show.
// ═══════════════════════════════════════════════════════════════════════

import styles from './EmptyState.module.css'

export interface EmptyStateProps {
  /** Emoji or icon to display above the text */
  icon?: string
  /** Main heading */
  title: string
  /** Supporting description */
  description?: string
  /** Optional CTA button */
  action?: {
    label: string
    onClick: () => void
  }
  /** Extra class for layout */
  className?: string
}

export default function EmptyState({
  icon = '📝',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.desc}>{description}</p>}
      {action && (
        <button className={styles.action} onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  )
}
