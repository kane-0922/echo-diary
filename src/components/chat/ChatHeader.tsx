// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Chat Header
// Glassmorphism top bar with session title and streaming indicator.
// ═══════════════════════════════════════════════════════════════════════

import { useApp } from '../../contexts/AppContext'
import styles from './ChatPage.module.css'

interface ChatHeaderProps {
  isStreaming: boolean
}

export default function ChatHeader({ isStreaming }: ChatHeaderProps) {
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
    </header>
  )
}
