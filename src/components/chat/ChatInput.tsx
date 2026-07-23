// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Chat Input
// Text area + quick actions + generate-diary button.
// ═══════════════════════════════════════════════════════════════════════

import {
  useState,
  useRef,
  useCallback,
  type KeyboardEvent,
} from 'react'
import styles from './ChatPage.module.css'

// ── Send Icon ──
function SendIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 10h14M12 6l4 4-4 4" />
    </svg>
  )
}

interface ChatInputProps {
  onSend: (content: string) => Promise<void>
  onEchoNudge: () => Promise<void>
  isStreaming: boolean
}

export default function ChatInput({
  onSend,
  onEchoNudge,
  isStreaming,
}: ChatInputProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isSendingRef = useRef(false)

  const trimmed = text.trim()
  const canSend = trimmed.length > 0 && !isStreaming && !isSendingRef.current

  // Auto-resize textarea
  const handleInput = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    setText(el.value)
  }, [])

  // Send message
  const handleSend = useCallback(async () => {
    if (!canSend || isSendingRef.current) return
    isSendingRef.current = true
    const content = trimmed
    setText('')
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    try {
      await onSend(content)
    } finally {
      isSendingRef.current = false
    }
  }, [canSend, trimmed, onSend])

  // Enter to send, Shift+Enter for newline
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  // Quick actions
  const handleQuickAction = useCallback((prompt: string) => {
    setText(prompt)
    textareaRef.current?.focus()
  }, [])

  const [isNudging, setIsNudging] = useState(false)
  const handleNudge = useCallback(async () => {
    if (isStreaming || isNudging) return
    setIsNudging(true)
    try {
      await onEchoNudge()
    } finally {
      setIsNudging(false)
    }
  }, [onEchoNudge, isStreaming, isNudging])

  return (
    <div className={styles.inputArea}>
      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <button
          className={styles.quickActionBtn}
          onClick={handleNudge}
          disabled={isStreaming || isNudging}
        >
          {isNudging ? '💡 Echo 正在思考…' : '💡 提示我写'}
        </button>
        <button
          className={styles.quickActionBtn}
          onClick={() => handleQuickAction('今天我的心情是...')}
          disabled={isStreaming}
        >
          🎭 记录心情
        </button>
      </div>

      {/* Input Row */}
      <div className={styles.inputRow}>
        <div className={styles.textareaWrap}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="和 Echo 聊聊今天…"
            rows={1}
            disabled={isStreaming}
            aria-label="消息输入框"
          />
        </div>
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!canSend}
          aria-label="发送消息"
          title="发送 (Enter)"
        >
          <SendIcon />
        </button>
      </div>

    </div>
  )
}
