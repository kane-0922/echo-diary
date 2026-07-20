// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — AI Service Factory
// Single entry point for the UI layer. Swap one line to switch between
// Mock, OpenAI, or Claude implementations.
// ═══════════════════════════════════════════════════════════════════════

import type { AiService } from './types'
import { mockAiService } from './mockAiService'

/**
 * Create the AI service instance.
 *
 * Current: Always returns Mock.
 *
 * Future (uncomment and configure):
 *   const config = JSON.parse(localStorage.getItem('echo-ai-config') || '{}')
 *   if (config.provider === 'openai') return new OpenAiService(config.apiKey)
 *   if (config.provider === 'claude') return new ClaudeService(config.apiKey)
 *   return mockAiService // fallback
 */
export function createAiService(): AiService {
  return mockAiService
}

// Re-export convenience
export type { AiService, ChatStreamChunk, ChatOptions, DiaryGeneration } from './types'
