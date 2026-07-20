// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Context Manager
// Manages conversation context window for AI token limits.
// In Mock mode this is pass-through; real AI uses truncation + summarisation.
// ═══════════════════════════════════════════════════════════════════════

import type { Message } from '../types'

export interface ContextConfig {
  /** Maximum messages to include (approximate token budgeting). */
  maxMessages: number
  /** Whether to include a summary of truncated messages. */
  includeSummary: boolean
}

const DEFAULT_CONFIG: ContextConfig = {
  maxMessages: 30,
  includeSummary: true,
}

/**
 * Rough token count estimator for Chinese + English mixed text.
 * ~1 token per Chinese character, ~0.75 tokens per English word.
 */
export function estimateTokens(text: string): number {
  let chineseChars = 0
  let englishWords = 0

  for (const char of text) {
    if (/[一-鿿㐀-䶿]/.test(char)) {
      chineseChars++
    }
  }

  // Rough English word count from remaining characters
  const englishText = text.replace(/[一-鿿㐀-䶿]/g, ' ')
  englishWords = englishText.split(/\s+/).filter(Boolean).length

  return chineseChars + Math.ceil(englishWords * 1.3)
}

/**
 * Truncate message history to fit within a token budget.
 *
 * Strategy:
 *   1. Always keep system-level context (first 2 messages if present).
 *   2. Keep the most recent N messages.
 *   3. If includeSummary is true, insert a summary placeholder for the truncated middle.
 *   4. For Mock: returns all messages unchanged (no real token budget).
 */
export function manageContext(
  messages: Message[],
  config: Partial<ContextConfig> = {},
): Message[] {
  const { maxMessages, includeSummary } = { ...DEFAULT_CONFIG, ...config }

  if (messages.length <= maxMessages) {
    return messages
  }

  // Keep first message (often contains system-level context) + recent messages
  const headCount = Math.min(1, messages.length)
  const tailCount = maxMessages - headCount - (includeSummary ? 1 : 0)

  const head = messages.slice(0, headCount)
  const tail = messages.slice(-Math.max(tailCount, 1))

  if (includeSummary && messages.length - headCount - tailCount > 2) {
    const truncated = messages.slice(headCount, -tailCount)
    const truncatedTokens = truncated.reduce(
      (sum, m) => sum + estimateTokens(m.content),
      0,
    )

    const summaryMessage: Message = {
      id: '__context_summary__',
      role: 'ai',
      content: `[对话摘要：中间省略了 ${truncated.length} 条消息，约 ${truncatedTokens} tokens。用户和 Echo 在此期间继续交流。]`,
      timestamp: truncated[Math.floor(truncated.length / 2)].timestamp,
    }

    return [...head, summaryMessage, ...tail]
  }

  return [...head, ...tail]
}

/**
 * Estimate total tokens in a message array.
 * Useful for pre-flight checks before sending to real AI.
 */
export function estimateTotalTokens(messages: Message[]): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content), 0)
}
