// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Claude Service (Reserved — Future Implementation)
//
// When ready to integrate Claude (Anthropic):
//   1. npm install @anthropic-ai/sdk
//   2. Implement the AiService interface below using the Anthropic SDK.
//   3. Replace createAiService() in index.ts.
//
// Expected pattern:
//   import Anthropic from '@anthropic-ai/sdk'
//   const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
//
//   chatStream: use client.messages.create({ stream: true })
//     → SDK stream → yield ChatStreamChunk
//
//   generateDiary: use client.messages.create({ stream: false })
//     with diaryGeneration prompt → parse JSON → DiaryGeneration
//
//   generateInsight: same pattern, single message → string
//
// ⚠️ Security note:
//   Same as OpenAI — browser-side API key exposure. Use a backend proxy
//   for production deployments.
// ═══════════════════════════════════════════════════════════════════════

import type { AiService, ChatStreamChunk, ChatOptions, DiaryGeneration } from './types'
import type { Mood, Message } from '../types'

export class ClaudeService implements AiService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async *chatStream(
    _messages: Message[],
    _options?: ChatOptions,
  ): AsyncGenerator<ChatStreamChunk> {
    throw new Error('Claude integration not yet implemented. Configure your API key in Settings.')
  }

  async generateDiary(_messages: Message[]): Promise<DiaryGeneration> {
    throw new Error('Claude integration not yet implemented.')
  }

  async generateInsight(_diaryContent: string, _mood: Mood | null): Promise<string> {
    throw new Error('Claude integration not yet implemented.')
  }
}
