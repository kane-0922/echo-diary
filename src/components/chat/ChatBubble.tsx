// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Chat Bubble
// Single message bubble with user/AI styling, streaming cursor,
// and error/retry state.
// ═══════════════════════════════════════════════════════════════════════

import type { Message } from '../../types'
import styles from './ChatPage.module.css'

interface ChatBubbleProps {
  message: Message
  isStreaming?: boolean
  isError?: boolean
  onRetry?: () => void
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export default function ChatBubble({
  message,
  isStreaming = false,
  isError = false,
  onRetry,
}: ChatBubbleProps) {
  const isUser = message.role === 'user'
  const isAi = message.role === 'ai'

  return (
    <div
      className={`${styles.bubble} ${
        isUser ? styles.bubbleUser : isError ? styles.errorBubble : styles.bubbleAi
      }`}
      role="listitem"
    >
      <p>
        {message.content || (isStreaming ? '' : '...')}
        {isStreaming && <span className={styles.cursor} />}
      </p>
      <div className={styles.bubbleTimestamp}>
        {formatTime(message.timestamp)}
      </div>
      {isError && onRetry && (
        <button className={styles.retryBtn} onClick={onRetry}>
          重新发送
        </button>
      )}
    </div>
  )
}
