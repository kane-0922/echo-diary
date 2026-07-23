// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — AI Service Factory
// 单一入口点，UI 层通过此函数获取 AI 服务实例。
// ═══════════════════════════════════════════════════════════════════════

import type { AiService } from './types'
import { zhipuService } from './zhipuService'

/**
 * 创建 AI 服务实例。
 * 当前使用智谱 AI 服务（GLM-4.5-Air），通过 /api/ai/chat 代理调用。
 */
export function createAiService(): AiService {
  return zhipuService
}

// Re-export convenience
export type { AiService, ChatStreamChunk, ChatOptions, DiaryGeneration } from './types'
