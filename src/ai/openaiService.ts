// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — OpenAI Service (Reserved — Future Implementation)
//
// When ready to integrate real OpenAI:
//   1. npm install openai
//   2. Implement the AiService interface below using the OpenAI SDK.
//   3. Replace createAiService() in index.ts.
//
// ⚠️ Security note:
//   dangerouslyAllowBrowser: true exposes the API key in the browser.
//   Use a backend proxy for production deployments.
// ═══════════════════════════════════════════════════════════════════════

import type { AiService, ChatStreamChunk, ChatOptions, DiaryGeneration } from './types'
import type { Mood, Message } from '../types'

export class OpenAiService implements AiService {
  // 预留：真实接入时保存 apiKey 用于初始化 OpenAI 客户端
  constructor(_apiKey: string) {
    void _apiKey
  }

  async *chatStream(
    _messages: Message[],
    _options?: ChatOptions,
  ): AsyncGenerator<ChatStreamChunk> {
    throw new Error('OpenAI integration not yet implemented. Configure your API key in Settings.')
  }

  async generateDiary(_messages: Message[]): Promise<DiaryGeneration> {
    throw new Error('OpenAI integration not yet implemented.')
  }

  async generateInsight(_diaryContent: string, _mood: Mood | null): Promise<string> {
    throw new Error('OpenAI integration not yet implemented.')
  }
}
