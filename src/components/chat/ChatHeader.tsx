// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Chat Header
// Glassmorphism top bar with session title, streaming indicator,
// and generate-diary action.
// ═══════════════════════════════════════════════════════════════════════

import { useApp } from '../../contexts/AppContext'
import styles from './ChatPage.module.css'

// ── Inline SVG ──

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 0l2.5 7.5L20 10l-7.5 2.5L10 20l-2.5-7.5L0 10l7.5-2.5z" />
      <path d="M7 4l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" opacity="0.5" />
    </svg>
  )
}

interface ChatHeaderProps {
  isStreaming: boolean
  onGenerateDiary: () => Promise<void>
  isGeneratingDiary: boolean
  canGenerateDiary: boolean
}

export default function ChatHeader({
  isStreaming,
  onGenerateDiary,
  isGeneratingDiary,
  canGenerateDiary,
}: ChatHeaderProps) {
  const { state } = useApp()
  const activeSession = state.chatSessions.find(
    (s) => s.id === state.activeChatId,
  )

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <span
          className={`${styles.headerStatus} ${isStreaming ? styles.streaming : ''}`}
          aria-label={isStreaming ? 'Echo 正在输入…' : 'Echo 在线'}
          title={isStreaming ? '正在输入…' : '在线'}
        />
        <h1 className={styles.headerTitle}>
          {activeSession?.title ?? '聊天'}
        </h1>
      </div>
      <div className={styles.headerActions}>
        <button
          className={styles.headerGenerateBtn}
          onClick={onGenerateDiary}
          disabled={!canGenerateDiary || isStreaming || isGeneratingDiary}
          aria-label="生成日记"
          title="将当前对话整理成日记"
        >
          {isGeneratingDiary ? (
            <>
              <span className={styles.generateSpinner} />
              生成中…
            </>
          ) : (
            <>
              <SparkleIcon />
              生成日记
            </>
          )}
        </button>
      </div>
    </header>
  )
}
