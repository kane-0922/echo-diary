// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Diary Card
// Single diary entry preview card. Clickable to edit.
// ═══════════════════════════════════════════════════════════════════════

import { useCallback } from 'react'
import type { DiaryEntry } from '../../types'
import { MOOD_EMOJI } from '../../types'
import styles from './DiaryListPage.module.css'

interface DiaryCardProps {
  diary: DiaryEntry
  onClick: (id: string) => void
}

/** Format an ISO date string to a friendly Chinese format */
function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const day = d.getDate()
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekday = weekdays[d.getDay()]
    return `${year}年${month}月${day}日 ${weekday}`
  } catch {
    return isoDate
  }
}

/** Get a short preview from content (first ~80 chars, single line) */
function contentPreview(content: string): string {
  const cleaned = content.replace(/\n+/g, ' ').trim()
  if (cleaned.length <= 80) return cleaned
  return cleaned.slice(0, 80) + '…'
}

export default function DiaryCard({ diary, onClick }: DiaryCardProps) {
  const handleClick = useCallback(() => onClick(diary.id), [diary.id, onClick])

  return (
    <article
      className={styles.card}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`查看日记：${diary.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      {/* Mood + Date row */}
      <div className={styles.cardMeta}>
        {diary.mood ? (
          <span className={styles.cardMood} title={diary.mood}>
            {MOOD_EMOJI[diary.mood]}
            <span className={styles.cardMoodLabel}>{diary.mood}</span>
          </span>
        ) : (
          <span className={styles.cardMood}>
            <span className={styles.cardMoodLabel}>未记录</span>
          </span>
        )}
        <span className={styles.cardDate}>{formatDate(diary.date)}</span>
      </div>

      {/* Title */}
      <h3 className={styles.cardTitle}>{diary.title || '未命名日记'}</h3>

      {/* Content preview */}
      <p className={styles.cardPreview}>{contentPreview(diary.content)}</p>

      {/* Insight snippet if available */}
      {diary.aiInsight && (
        <p className={styles.cardInsight}>💬 {contentPreview(diary.aiInsight)}</p>
      )}

      {/* Hover arrow indicator */}
      <span className={styles.cardArrow} aria-hidden="true">
        →
      </span>
    </article>
  )
}
