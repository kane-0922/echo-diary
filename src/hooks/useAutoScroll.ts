// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — useAutoScroll Hook
// Automatically scrolls a container to the bottom when content changes,
// with smart "user scrolled up" detection.
// ═══════════════════════════════════════════════════════════════════════

import { useRef, useEffect, useCallback } from 'react'

interface UseAutoScrollOptions {
  /** The value to watch — scrolls to bottom when it changes. */
  trigger: unknown
  /** Distance from bottom (px) within which auto-scroll is enabled. */
  threshold?: number
}

export function useAutoScroll(
  options: UseAutoScrollOptions,
): {
  containerRef: React.RefObject<HTMLDivElement | null>
  scrollToBottom: (smooth?: boolean) => void
} {
  const { trigger, threshold = 120 } = options
  const containerRef = useRef<HTMLDivElement | null>(null)
  const userScrolledUpRef = useRef(false)

  // Detect manual scrolling
  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    userScrolledUpRef.current = distanceFromBottom > threshold
  }, [threshold])

  // Scroll to bottom (called on new messages)
  const scrollToBottom = useCallback(
    (smooth = true) => {
      const el = containerRef.current
      if (!el) return
      userScrolledUpRef.current = false
      el.scrollTo({
        top: el.scrollHeight,
        behavior: smooth ? 'smooth' : 'instant',
      })
    },
    [],
  )

  // Auto-scroll when trigger changes (new message content), unless user scrolled up
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // During active streaming, always follow (user can't really "read" while streaming)
    if (!userScrolledUpRef.current) {
      scrollToBottom(true)
    }
  }, [trigger, scrollToBottom])

  // Attach scroll listener
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return { containerRef, scrollToBottom }
}
