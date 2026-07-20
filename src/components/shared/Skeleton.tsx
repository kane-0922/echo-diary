// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Skeleton
// Animated placeholder for async content loading.
// ═══════════════════════════════════════════════════════════════════════

import styles from './Skeleton.module.css'

export interface SkeletonProps {
  /** CSS width (e.g. "100%", "200px"). Default: "100%" */
  width?: string
  /** CSS height (e.g. "1rem", "48px"). Default: "1rem" */
  height?: string
  /** Preset shapes */
  variant?: 'text' | 'card' | 'circle' | 'title'
  /** Extra class name for layout composition */
  className?: string
}

const DEFAULTS: Record<string, { width: string; height: string }> = {
  text: { width: '100%', height: '0.875rem' },
  card: { width: '100%', height: '120px' },
  circle: { width: '40px', height: '40px' },
  title: { width: '60%', height: '1.5rem' },
}

export default function Skeleton({
  width,
  height,
  variant = 'text',
  className,
}: SkeletonProps) {
  const preset = DEFAULTS[variant]
  const w = width ?? preset.width
  const h = height ?? preset.height

  return (
    <div
      className={`${styles.skeleton} ${className ?? ''}`}
      style={{ width: w, height: h }}
      aria-hidden="true"
    />
  )
}
