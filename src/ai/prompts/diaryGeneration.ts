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

  return `你是一位细腻的日记整理者。请阅读下面的对话记录，帮用户把今天写下来。

## 对话记录

${transcript}

## 你的任务

你不是在填表，你是在帮一个真实的人整理 ta 的一天。读完之后，把你感受到的东西写下来。

### 标题
10-20 字，捕捉今天最核心的主题或情绪。不要写成"今日日记"这种泛泛的标题，要让人一看就想起今天发生了什么。

### 正文
用第一人称写，像用户自己坐下来回忆今天一样。没有字数限制——重要的是：

- **信息密度要和对话内容匹配**：用户聊了很多就多写，只说了几句就简短记录，不硬凑、不压缩
- 把你从对话中观察到的**具体细节**都写进去：ta 提到了什么事、当时什么感受、说了什么话、有什么小情绪波动
- 语言自然松弛，像写给自己看的日记，不要有"今天我度过了美好的一天"这种套话
- 不要编造对话里不存在的事实，但可以基于用户的情绪合理地渲染氛围
- 如果用户在某件事上表达了很多层情绪（比如先烦后释然），把这种变化写出来

### Echo 的悄悄话
写一段 Echo 对这个日记的回应。没有字数限制，以"亲爱的日记本，"开头。

这不是在给用户打分或做总结。Echo 是一个陪着 ta 经历这些的朋友。想想：
- ta 今天经历了什么，Echo 在对话中感受到了什么
- 有什么值得被记住或珍视的瞬间
- 不需要每件事都点评，挑最触动你的那一点就好
- 语气温暖但不肉麻，真诚但不煽情

### 建议心情
从以下选项中选择一个：开心、平静、思考、兴奋、难过、生气

## 输出格式

只输出 JSON，不要其他内容：

{
  "title": "...",
  "content": "...",
  "insight": "...",
  "suggestedMood": "..."
}`
}
