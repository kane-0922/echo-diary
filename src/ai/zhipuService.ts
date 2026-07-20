// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — 智谱 AI 服务
// 通过后端代理 /api/ai/chat 调用智谱 GLM API。
// 智谱 API 完全兼容 OpenAI Chat Completions 格式。
// ═══════════════════════════════════════════════════════════════════════

import type { AiService, ChatStreamChunk, ChatOptions, DiaryGeneration } from './types'
import type { Mood, Message } from '../types'
import { ECHO_SYSTEM_PROMPT } from './prompts/chatSystem'
import { buildDiaryPrompt } from './prompts/diaryGeneration'
import { buildInsightPrompt } from './prompts/insightGeneration'
import { manageContext } from './contextManager'

// ── 配置 ──

/** 智谱模型 ID */
const MODEL = 'glm-4.5-air'

/** 代理端点 — Vite dev proxy 或生产代理服务器转发到智谱 API */
const PROXY_URL = '/api/ai/chat/completions'

/** 非流式请求超时（毫秒） */
const NON_STREAM_TIMEOUT = 60_000

// ── 请求体类型（智谱 / OpenAI 兼容格式） ──

interface ChatRequestBody {
  model: string
  messages: { role: string; content: string }[]
  stream: boolean
  temperature?: number
  max_tokens?: number
  response_format?: { type: 'text' | 'json_object' }
  thinking?: { type: 'enabled' | 'disabled' }
}

// ── SSE 解析 ──

/**
 * 从 SSE 流中逐块解析 delta 文本。
 * 参考智谱文档：https://docs.bigmodel.cn/cn/guide/capabilities/streaming
 */
async function* parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<ChatStreamChunk> {
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      // 最后一行可能不完整，保留到下次处理
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue

        const data = trimmed.slice(6) // 去掉 "data: " 前缀

        // 流结束标记
        if (data === '[DONE]') {
          yield { delta: '', done: true }
          return
        }

        try {
          const parsed = JSON.parse(data)
          const choice = parsed?.choices?.[0]

          // 检查是否结束
          if (choice?.finish_reason) {
            yield { delta: '', done: true }
            return
          }

          // 提取增量内容（跳过空字符串和推理内容）
          const content = choice?.delta?.content
          if (content) {
            yield { delta: content, done: false }
          }
          // 注意：忽略 delta.reasoning_content（思考过程），UI 只显示正文
        } catch {
          // JSON 解析失败，跳过该行继续
          continue
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// ── API 调用辅助 ──

async function apiCall(body: ChatRequestBody, signal?: AbortSignal): Promise<Response> {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    let errorMessage = `API 请求失败 (${response.status})`
    try {
      const errorBody = await response.json()
      if (errorBody?.error?.message) {
        errorMessage = errorBody.error.message
      }
    } catch {
      // 无法解析错误响应体，使用默认消息
    }
    throw new Error(errorMessage)
  }

  return response
}

// ── 智谱 AiService 实现 ──

export const zhipuService: AiService = {
  // ═══════════════════════════════════════════════════════════════════
  // 流式聊天
  // ═══════════════════════════════════════════════════════════════════

  async *chatStream(
    messages: Message[],
    options?: ChatOptions,
  ): AsyncGenerator<ChatStreamChunk> {
    // 控制上下文长度：128K token 预算，保留最近 40 条消息
    const managed = manageContext(messages, { maxMessages: 40, includeSummary: true })

    // 构建 API 消息列表：system prompt + 对话历史
    const apiMessages: { role: string; content: string }[] = [
      { role: 'system', content: options?.systemPrompt ?? ECHO_SYSTEM_PROMPT },
      ...managed.map((m) => ({
        role: m.role === 'ai' ? 'assistant' : (m.role as string),
        content: m.content,
      })),
    ]

    const body: ChatRequestBody = {
      model: MODEL,
      messages: apiMessages,
      stream: true,
      temperature: options?.temperature ?? 0.8,
      max_tokens: options?.maxTokens ?? 2048,
      // 禁用思考模式，避免返回 reasoning_content 干扰打字机效果
      thinking: { type: 'disabled' },
    }

    const response = await apiCall(body)

    if (!response.body) {
      throw new Error('响应体为空')
    }

    const reader = response.body.getReader()
    yield* parseSSEStream(reader)
  },

  // ═══════════════════════════════════════════════════════════════════
  // 生成日记
  // ═══════════════════════════════════════════════════════════════════

  async generateDiary(messages: Message[]): Promise<DiaryGeneration> {
    const diaryPrompt = buildDiaryPrompt(
      messages.map((m) => ({ role: m.role, content: m.content })),
    )

    const body: ChatRequestBody = {
      model: MODEL,
      messages: [{ role: 'user', content: diaryPrompt }],
      stream: false,
      temperature: 0.7,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
      thinking: { type: 'disabled' },
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), NON_STREAM_TIMEOUT)

    try {
      const response = await apiCall(body, controller.signal)
      const data = await response.json()
      const rawContent = data?.choices?.[0]?.message?.content

      if (!rawContent) {
        throw new Error('AI 未返回日记内容')
      }

      // 解析 JSON 响应
      const parsed = JSON.parse(rawContent) as {
        title?: string
        content?: string
        insight?: string
        suggestedMood?: string
      }

      // 校验 suggestedMood 是否为合法 Mood 值
      const validMoods: Mood[] = ['开心', '平静', '思考', '兴奋', '难过', '生气']
      const mood: Mood | undefined = validMoods.includes(
        parsed.suggestedMood as Mood,
      )
        ? (parsed.suggestedMood as Mood)
        : undefined

      return {
        title: parsed.title ?? '未命名日记',
        content: parsed.content ?? rawContent,
        insight: parsed.insight ?? '今天也是值得记录的一天呢 🌿',
        suggestedMood: mood,
      }
    } finally {
      clearTimeout(timeout)
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // 生成 Echo 洞察
  // ═══════════════════════════════════════════════════════════════════

  async generateInsight(diaryContent: string, mood: Mood | null): Promise<string> {
    const insightPrompt = buildInsightPrompt(diaryContent, mood)

    const body: ChatRequestBody = {
      model: MODEL,
      messages: [{ role: 'user', content: insightPrompt }],
      stream: false,
      temperature: 0.8,
      max_tokens: 512,
      thinking: { type: 'disabled' },
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), NON_STREAM_TIMEOUT)

    try {
      const response = await apiCall(body, controller.signal)
      const data = await response.json()
      const content = data?.choices?.[0]?.message?.content

      if (!content) {
        throw new Error('AI 未返回洞察内容')
      }

      return content.trim()
    } finally {
      clearTimeout(timeout)
    }
  },
}
