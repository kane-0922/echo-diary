// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Diary Generation Prompt Template
// Extracts structured diary + insight from chat transcript.
// ═══════════════════════════════════════════════════════════════════════

/**
 * Build the diary-generation prompt from a chat transcript.
 * The prompt instructs the AI to produce a structured JSON-like output
 * that maps to DiaryGeneration.
 */
export function buildDiaryPrompt(messages: { role: string; content: string }[]): string {
  const transcript = messages
    .map((m) => `[${m.role === 'user' ? '用户' : 'Echo'}]: ${m.content}`)
    .join('\n\n')

  return `你是一位专业的日记助手。请根据以下对话记录，为用户整理一篇日记。

## 对话记录

${transcript}

## 要求

请根据对话内容生成以下内容，用中文书写，语气温暖而真诚：

1. **标题**（10-20字）：捕捉今天最核心的主题或情绪
2. **正文**（200-400字）：第一人称，以用户的视角叙述今天发生的事和感受。要有细节和情感，但不要编造对话中没有的内容。
3. **Echo 洞察**（50-100字）：以 Echo 的口吻，对用户今天的经历给出一句温暖的观察或鼓励。以"亲爱的日记本，"开头。
4. **建议心情**：从以下选项中选择最匹配的一个：开心、平静、思考、兴奋、难过、生气

请按以下 JSON 格式输出（只输出 JSON，不要其他内容）：
{
  "title": "...",
  "content": "...",
  "insight": "...",
  "suggestedMood": "..."
}`
}
