// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — AI Service Types
// Abstract interface shared by Mock and real AI implementations.
// ═══════════════════════════════════════════════════════════════════════

import type { Mood, Message } from '../types'

// ── Streaming ──

/** A single chunk of the streaming chat response. */
export interface ChatStreamChunk {
  /** Incremental text to append (empty string when done with no content). */
  delta: string
  /** Whether the stream has completed. */
  done: boolean
}

// ── Chat Options (forward-looking: maps 1:1 to OpenAI/Claude params) ──

export interface ChatOptions {
  /** System prompt override (defaults to Echo persona). */
  systemPrompt?: string
  /** Max tokens for the response. */
  maxTokens?: number
  /** Sampling temperature (0-2). */
  temperature?: number
}

// ── Diary Generation ──

export interface DiaryGeneration {
  title: string
  content: string
  insight: string
  suggestedMood?: Mood
}

// ── AiService Interface ──

export interface AiService {
  /**
   * Stream a chat response token-by-token.
   * The UI consumes this via `for await (...)` to render typewriter effect.
   */
  chatStream(
    messages: Message[],
    options?: ChatOptions,
  ): AsyncGenerator<ChatStreamChunk>

  /**
   * Generate a diary draft from a chat transcript.
   * Non-streaming — returns the full structured result.
   */
  generateDiary(messages: Message[]): Promise<DiaryGeneration>

  /**
   * Generate an Echo insight for an existing diary entry.
   */
  generateInsight(diaryContent: string, mood: Mood | null): Promise<string>
}
