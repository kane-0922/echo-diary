// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Chat Message List
// Scrollable message area with empty-state guidance.
// ═══════════════════════════════════════════════════════════════════════

import type { Message } from '../../types'
import ChatBubble from './ChatBubble'
import { useAutoScroll } from '../../hooks/useAutoScroll'
import styles from './ChatPage.module.css'

interface ChatMessageListProps {
  messages: Message[]
  streamingMessageId: string | null
  errorMessageId: string | null
  onRetry: (messageId: string) => void
  onPromptClick: (prompt: string) => void
}

// Suggested prompts for empty state
const SUGGESTED_PROMPTS = [
  '今天过得怎么样？',
  '我今天心情不太好…',
  '帮我回顾一下这周',
  '想和你随便聊聊天',
]

export default function ChatMessageList({
  messages,
  streamingMessageId,
  errorMessageId,
  onRetry,
  onPromptClick,
}: ChatMessageListProps) {
  const { containerRef } = useAutoScroll({
    trigger: messages.reduce((acc, m) => acc + m.content.length, 0),
  })

  // Empty state
  if (messages.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon} aria-hidden="true">
          🌿
        </div>
        <h2 className={styles.emptyTitle}>开始和 Echo 聊天吧</h2>
        <p className={styles.emptyHint}>
          随便聊聊今天发生的事，Echo 会认真倾听。
          聊完之后，它可以帮你整理成一篇温暖的日记 ✨
        </p>
        <div className={styles.emptyPrompts}>
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              className={styles.emptyPromptBtn}
              onClick={() => onPromptClick(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.messageList} ref={containerRef} role="list">
      {messages.map((msg) => (
        <ChatBubble
          key={msg.id}
          message={msg}
          isStreaming={msg.id === streamingMessageId}
          isError={msg.id === errorMessageId}
          onRetry={
            msg.id === errorMessageId
              ? () => onRetry(msg.id)
              : undefined
          }
        />
      ))}
    </div>
  )
}
