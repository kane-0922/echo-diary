// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — OpenAI Service (Reserved — Future Implementation)
//
// When ready to integrate real OpenAI:
//   1. npm install openai
//   2. Implement the AiService interface below using the OpenAI SDK.
//   3. Replace createAiService() in index.ts.
//
// Expected pattern:
//   import OpenAI from 'openai'
//   const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
//
//   chatStream: use client.chat.completions.create({ stream: true })
//     → ReadableStream → yield ChatStreamChunk
//
//   generateDiary: use client.chat.completions.create({ stream: false })
//     with diaryGeneration prompt → parse JSON → DiaryGeneration
//
//   generateInsight: same pattern, single completion → string
//
// ⚠️ Security note:
//   dangerouslyAllowBrowser: true exposes the API key in the browser.
//   For production, use a backend proxy (Supabase Edge Function, Vercel
//   Serverless, Cloudflare Worker) instead of direct browser-to-OpenAI calls.
// ═══════════════════════════════════════════════════════════════════════

import type { AiService, ChatStreamChunk, ChatOptions, DiaryGeneration } from './types'
import type { Mood, Message } from '../types'

// Placeholder — replace with real OpenAI SDK call when integrating.

export class OpenAiService implements AiService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
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
