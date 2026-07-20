// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — AI Service Factory
// 单一入口点，UI 层通过此函数获取 AI 服务实例。
// ═══════════════════════════════════════════════════════════════════════

import type { AiService } from './types'
import { zhipuService } from './zhipuService'
// import { mockAiService } from './mockAiService'  // 调试时切换回 Mock

/**
 * 创建 AI 服务实例。
 *
 * 当前：返回智谱 AI 服务（GLM-4.5-Air），通过 /api/ai/chat 代理调用。
 *
 * 切换回 Mock 用于调试：
 *   取消下面 mockAiService 的注释，注释掉 zhipuService
 */
export function createAiService(): AiService {
  return zhipuService
}

// Re-export convenience
export type { AiService, ChatStreamChunk, ChatOptions, DiaryGeneration } from './types'
