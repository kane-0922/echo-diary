// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Echo Insight Card
// AI-generated reflection on the diary entry, with refresh capability.
// ═══════════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react'
import type { Mood } from '../../types'
import { useApp } from '../../contexts/AppContext'
import styles from './DiaryEditPage.module.css'

interface EchoInsightProps {
  insight: string
  diaryContent: string
  mood: Mood | null
  onInsightChange: (newInsight: string) => void
}

export default function EchoInsight({
  insight,
  diaryContent,
  mood,
  onInsightChange,
}: EchoInsightProps) {
  const { aiService } = useApp()
  const [isRegenerating, setIsRegenerating] = useState(false)

  const handleRegenerate = useCallback(async () => {
    if (isRegenerating || !diaryContent.trim()) return
    setIsRegenerating(true)
    try {
      const newInsight = await aiService.generateInsight(diaryContent, mood)
      onInsightChange(newInsight)
    } catch {
      // Silently keep current insight
    } finally {
      setIsRegenerating(false)
    }
  }, [isRegenerating, diaryContent, mood, aiService, onInsightChange])

  return (
    <div className={styles.insightCard}>
      <div className={styles.insightHeader}>
        <span className={styles.insightLabel}>
          💬 Echo 说
        </span>
        <button
          className={styles.insightRefresh}
          onClick={handleRegenerate}
          disabled={isRegenerating || !diaryContent.trim()}
          title="重新生成洞察"
        >
          {isRegenerating ? (
            <>
              <span className={styles.insightSpinner} />
              生成中…
            </>
          ) : (
            '✨ 换一句'
          )}
        </button>
      </div>
      <p className={styles.insightText}>
        {insight || '写完日记后，Echo 会在这里给你一段温暖的回应。'}
      </p>
    </div>
  )
}
