// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Claude Service (Reserved — Future Implementation)
//
// When ready to integrate Claude (Anthropic):
//   1. npm install @anthropic-ai/sdk
//   2. Implement the AiService interface below using the Anthropic SDK.
//   3. Replace createAiService() in index.ts.
//
// ⚠️ Security note:
//   Browser-side API key exposure. Use a backend proxy for production.
// ═══════════════════════════════════════════════════════════════════════

import type { Message, Mood } from '../types'
import type { AiService, ChatOptions, ChatStreamChunk, DiaryGeneration } from './types'

export class ClaudeService implements AiService {
  // 预留：真实接入时保存 apiKey 用于初始化 Anthropic 客户端
  constructor(_apiKey: string) {
    void _apiKey
  }

  // oxlint-disable-next-line require-yield
  async *chatStream(_messages: Message[], _options?: ChatOptions): AsyncGenerator<ChatStreamChunk> {
    throw new Error('Claude integration not yet implemented. Configure your API key in Settings.')
  }

  async generateDiary(_messages: Message[]): Promise<DiaryGeneration> {
    throw new Error('Claude integration not yet implemented.')
  }

  async generateInsight(_diaryContent: string, _mood: Mood | null): Promise<string> {
    throw new Error('Claude integration not yet implemented.')
  }
}
