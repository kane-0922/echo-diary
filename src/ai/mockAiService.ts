// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Mock AI Service
// Keyword-based mock with streaming AsyncGenerator output.
// Fully satisifies the AiService interface — real AI drops in without
// a single UI change.
// ═══════════════════════════════════════════════════════════════════════

import type { Mood, Message } from '../types'
import type {
  AiService,
  ChatStreamChunk,
  ChatOptions,
  DiaryGeneration,
} from './types'
import { analyzeMessage } from './keywordDict'
import { generateId, nowISO } from '../utils/idGenerator'

// ═══════════════════════════════════════════════════════════════════════
// Template Library — 12 scenario-based templates
// ═══════════════════════════════════════════════════════════════════════

type TemplateCategory =
  | 'greeting'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'pensive'
  | 'excited'
  | 'tired'
  | 'work'
  | 'social'
  | 'reflection'
  | 'diary_prompt'
  | 'fallback'

interface ReplyTemplate {
  templates: string[]
  slotHints?: string[]
}

const REPLY_TEMPLATES: Record<TemplateCategory, ReplyTemplate> = {
  greeting: {
    templates: [
      '嗨～很高兴见到你！今天有什么想聊的吗？',
      '你好呀！Echo 在这里等你呢 ☀️ 今天过得怎么样？',
      '嘿，欢迎回来！有没有什么新鲜事想分享？',
    ],
  },
  happy: {
    templates: [
      '听起来太棒了！为你高兴～能多说说{slot}吗？',
      '哈哈真不错！{slot}的感觉一定很好吧 😄',
      '这种开心的时刻值得好好记住呢。{slot}的细节还有吗？',
      '真好！我好想知道{slot}的时候你心里在想什么～',
    ],
    slotHints: ['这件事', '当时', '那个瞬间', '具体情况'],
  },
  sad: {
    templates: [
      '听到这些，我能感受到你的心情。想多聊聊吗？不用着急。',
      '辛苦了，{slot}确实不容易。我在这里听你说。',
      '有时候把难过的事说出来，心里会轻松一些。你愿意多说一点吗？',
      '谢谢你和我说这些。{slot}的感觉我懂，你不是一个人。',
    ],
    slotHints: ['遇到这样的事', '心里不舒服', '这段时间'],
  },
  angry: {
    templates: [
      '嗯，这确实让人火大 😤 把细节说出来可能会好受点？',
      '我能理解你的不爽。{slot}换谁都会生气的。',
      '先深呼吸一下～然后跟我说说到底怎么回事？',
    ],
    slotHints: ['这种事情', '碰到这样的情况'],
  },
  pensive: {
    templates: [
      '嗯，{slot}确实值得想一想。你心里更偏向哪个方向呢？',
      '能停下来思考这些，本身就很了不起。有什么线索了吗？',
      '有时候答案不是一下子冒出来的，慢慢聊着聊着就清晰了。你想先聊哪部分？',
      '这种感觉我懂，像是站在岔路口。要不要一件一件梳理看看？',
    ],
    slotHints: ['这个问题', '这件事', '这个选择'],
  },
  excited: {
    templates: [
      '哇！！这太让人兴奋了 🤩 {slot}的具体计划是什么呀？',
      '天哪我好期待！快跟我说说{slot}的细节～',
      '哈哈你的兴奋隔着屏幕都传过来了！一定要好好享受{slot}！',
    ],
    slotHints: ['这件事', '这个计划', '这个好消息'],
  },
  tired: {
    templates: [
      '辛苦了，今天确实不容易。好好休息一下是应该的 ☕',
      '累的时候记得善待自己。今天有什么小事让你觉得还好吗？',
      '有时候一天下来什么都不想干，完全正常。要不要聊聊轻松的话题换换脑子？',
      '抱抱～{slot}真的很消耗精力。现在最想做什么来放松一下？',
    ],
    slotHints: ['这样忙了一天', '高强度的工作'],
  },
  work: {
    templates: [
      '工作上的事确实容易让人纠结。你觉得最核心的问题是什么？',
      '嗯，{slot}这件事…如果抛开所有限制，你理想中的结果是什么样的？',
      '职场里的事千头万绪，能具体说说是哪个环节让你最在意吗？',
    ],
    slotHints: ['这个项目', '这件事', '这段工作'],
  },
  social: {
    templates: [
      '和朋友在一起的时光总是特别的！{slot}里面最让你难忘的是什么？',
      '社交有时候是充电，有时候也挺耗电的哈哈。这次是属于哪一种？',
      '真好呀，有人一起{slot}的感觉就是不一样～',
    ],
    slotHints: ['这次聚会', '这段时光', '这次见面'],
  },
  reflection: {
    templates: [
      '回顾一下，{slot}给你带来了什么新的想法吗？',
      '能停下来回头看，本身就是一种成长。你有什么发现？',
      '嗯，这些经历串起来看，好像能看到一些以前没注意的东西呢。',
    ],
    slotHints: ['这段时间', '这些经历', '这些事情'],
  },
  diary_prompt: {
    templates: [
      '说起来，这些内容真的很适合写进今天的日记里呢 📝 要我帮你整理成一篇吗？点一下"生成日记"就好～',
      '感觉今天收获了不少故事！要不要把它们变成一篇温暖的日记？',
      '我越来越觉得今天值得被记录下来。等你准备好了，随时可以生成日记哦 ✨',
    ],
  },
  fallback: {
    templates: [
      '嗯嗯，我在听～继续说吧',
      '有意思！还有呢？',
      '我很好奇更多细节，说给我听听？',
      '原来是这样。那后来怎么样了？',
      '嗯…这让我想到，你觉得{slot}对你来说意味着什么？',
    ],
    slotHints: ['这些', '这件事', '这些经历'],
  },
}

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isGreeting(content: string): boolean {
  const greetings = ['你好', '嗨', 'hi', 'hello', '嘿', '早', '晚上好', '下午好', '在吗']
  return greetings.some((g) => content.toLowerCase().includes(g)) && content.length < 15
}

function isDiaryIntent(content: string): boolean {
  const intents = [
    '写日记', '生成日记', '帮我记录', '记录下来', '做日记',
    '创建日记', '记录一下', '写下来', '记下来', '总结一下',
    '帮我写', '整理日记',
  ]
  return intents.some((i) => content.includes(i))
}

/** Classify message into a template category. */
function classify(content: string): TemplateCategory {
  if (isGreeting(content)) return 'greeting'
  if (isDiaryIntent(content)) return 'diary_prompt'

  const analysis = analyzeMessage(content)
  const mood = analysis.primaryMood
  const activities = analysis.activities

  // Activity-based routing first
  if (activities.includes('work')) return 'work'
  if (activities.includes('social')) return 'social'

  // Then mood-based
  switch (mood) {
    case '开心':
      return 'happy'
    case '难过':
      return 'sad'
    case '生气':
      return 'angry'
    case '思考':
      return 'pensive'
    case '兴奋':
      return 'excited'
    case '平静':
      return 'reflection'
  }

  return 'fallback'
}

/** Fill template slots with random hints or a default. */
function fillTemplate(template: string, replyTemplates: ReplyTemplate): string {
  const hints = replyTemplates.slotHints
  const slot = hints ? pick(hints) : '这件事'
  return template.replace(/\{slot\}/g, slot)
}

// ═══════════════════════════════════════════════════════════════════════
// Mock Chat Response Builder
// ═══════════════════════════════════════════════════════════════════════

function buildResponse(userContent: string): string {
  const category = classify(userContent)
  const replyTemplate = REPLY_TEMPLATES[category]
  const raw = pick(replyTemplate.templates)
  return fillTemplate(raw, replyTemplate)
}

// ═══════════════════════════════════════════════════════════════════════
// AsyncGenerator Streaming
// ═══════════════════════════════════════════════════════════════════════

/**
 * Yield characters one-by-one at ~30ms intervals, simulating a real AI
 * streaming response. Adds natural pauses at punctuation.
 */
async function* streamText(
  text: string,
  charDelayMs: number = 30,
): AsyncGenerator<ChatStreamChunk> {
  const chars = [...text] // handles emoji as single chars

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]
    yield { delta: char, done: false }

    // Natural pause at sentence boundaries
    const pauseChars = ['。', '！', '？', '…', '\n', '～', '😄', '☕', '✨', '📝', '😤', '🤩']
    const delayMs = pauseChars.includes(char) ? charDelayMs * 4 : charDelayMs

    // Slightly randomise delay for natural feel
    const jitter = (Math.random() - 0.5) * 15
    await delay(Math.max(10, delayMs + jitter))
  }

  yield { delta: '', done: true }
}

// ═══════════════════════════════════════════════════════════════════════
// Diary Generation
// ═══════════════════════════════════════════════════════════════════════

function generateDiaryTitle(messages: Message[]): string {
  const userMessages = messages.filter((m) => m.role === 'user')
  if (userMessages.length === 0) return '平凡的一天'

  const lastUserContent = userMessages[userMessages.length - 1].content
  const analysis = analyzeMessage(lastUserContent)

  const titleTemplates: Record<Mood, string[]> = {
    开心: ['开心的一天 ✨', '今天的小确幸', '阳光洒满的日子', '那些让人微笑的瞬间'],
    平静: ['宁静的一天', '与自己相处的时光', '平淡中的美好', '安静的日子'],
    思考: ['思绪万千的一天', '在思考中前行', '寻找答案的日子', '内心OS记录'],
    兴奋: ['激动人心的一天 🎉', '今天太棒了', '值得纪念的日子', '心跳加速的瞬间'],
    难过: ['不太顺利的一天', '低落的午后', '灰色调的日子', '和自己和解'],
    生气: ['烦躁的一天', '需要冷静的日子', '今天有点暴躁', '情绪过山车'],
  }

  return pick(titleTemplates[analysis.primaryMood])
}

function generateDiaryContent(messages: Message[]): string {
  const userMessages = messages.filter((m) => m.role === 'user')
  if (userMessages.length === 0) {
    return '今天没发生什么特别的事，但平凡本身就是一种安稳。'
  }

  const summary = userMessages
    .slice(-5)
    .map((m) => m.content)
    .join('。')

  const analysis = analyzeMessage(userMessages[userMessages.length - 1].content)
  const mood = analysis.primaryMood

  const contentTemplates: Record<Mood, string[]> = {
    开心: [
      `今天真是美好的一天。${summary}，这些点点滴滴的快乐，汇成了满满的幸福感。\n\n有时候快乐不需要惊天动地，一个微笑、一句暖心的问候，就足以让一整天都亮起来。\n\n感恩今天所有的相遇和美好。`,
      `记录今天最开心的一刻：${summary.slice(0, 40)}...\n\n这种感觉真好呀。生活里总有让人嘴角上扬的瞬间，今天尤其多。希望以后的日记里，也能常常写下这样的快乐。`,
    ],
    平静: [
      `今天是安静的一天。${summary}。\n\n没有太多波澜，却有一种踏实的安稳感。也许这就是生活最真实的样子——不需要每天都精彩，舒舒服服地度过，就是最好的状态。\n\n喝了一杯热茶，发了一会儿呆。这样的节奏挺好的。`,
      `偶尔也需要这样一天，什么都不赶，什么都不急。${summary}。\n\n安静的时候，反而能听见心里的声音。今天给自己放了个假，感觉被治愈了。`,
    ],
    思考: [
      `今天脑子里转了很多念头。${summary}。\n\n有些事情还没想明白，但没关系，思考的过程本身就有价值。也许过几天回头看，答案会自己浮现。\n\n把今天的困惑和想法都记下来，算是理一理思路。`,
      `有一些事情萦绕在心头。${summary}。\n\n人生的路口总是让人犹豫，但每一个选择都是一次成长。今天虽然没有得出结论，但至少开始认真面对了。`,
    ],
    兴奋: [
      `今天太让人兴奋了！${summary}！！\n\n这种感觉就像等了很久的礼物终于到了手里。想记住今天的每一秒，因为这种心跳加速的时刻不常有。\n\n未来回头看，今天一定是个重要的日子。`,
      `超级期待的一天！${summary}。\n\n迫不及待想把这些激动的心情记录下来。生活就是这样，总有一些瞬间让你觉得"活着真好"。`,
    ],
    难过: [
      `今天心情不太好。${summary}。\n\n有时候难过就是难过，不需要什么理由，也不需要立刻好起来。允许自己低落一会儿，也是一种温柔。\n\n明天太阳还会升起，但今天就这样吧，没关系。`,
      `有些日子就是灰色的。${summary}。\n\n把不开心的都写下来，像是把包袱暂时放在纸上。也许过一段时间再看，会发现今天在乎的事没那么重。但现在，承认自己难过也很好。`,
    ],
    生气: [
      `今天真的很烦躁。${summary}。\n\n一肚子火没处发。把这些写下来，算是给自己的情绪一个出口。生气过后，也许会发现真正在意的不是这件事本身，而是别的什么。\n\n给自己一点时间冷静下来。`,
      `今天有点暴躁。${summary}。\n\n情绪上来了挡都挡不住。不评价自己的反应对不对，先记下来。等平静了再看，也许会笑自己为什么这么激动。`,
    ],
  }

  return pick(contentTemplates[mood])
}

function generateDiaryInsight(messages: Message[]): string {
  const userMessages = messages.filter((m) => m.role === 'user')
  const content = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : ''
  const analysis = analyzeMessage(content)
  const mood = analysis.primaryMood

  const insightTemplates: Record<Mood, string[]> = {
    开心: [
      '亲爱的日记本，今天的快乐像一颗糖，甜在嘴里也甜在心里。能够为小事开心的人，是真正懂得生活的人。愿这些闪闪发光的瞬间，成为你日后疲惫时的小太阳。',
      '亲爱的日记本，看到你今天的笑容，我也跟着开心起来。记住这种感觉——它比你想象的更有力量。',
    ],
    平静: [
      '亲爱的日记本，今天没有惊涛骇浪，但有一湖静水。在忙碌的世界里，能和自己安静相处，是一种难得的奢侈。好好享受这份安宁吧。',
      '亲爱的日记本，平淡不是无聊，而是一种深度的滋养。你在今天的时间里，好好地呼吸了。这很重要。',
    ],
    思考: [
      '亲爱的日记本，思考是心灵的运动。你今天在脑海里跑的每一步，都在悄悄改变你看世界的方式。答案不重要，重要的是你在寻找。',
      '亲爱的日记本，迷茫的时候，其实是在给自己重新定位的机会。你不必立刻知道答案，带着问题前行也是一种能力。',
    ],
    兴奋: [
      '亲爱的日记本，今天的兴奋像烟花一样绚烂！这种全力以赴期待的心情，就是生活给你的奖励。尽情享受吧，你值得这一切。',
      '亲爱的日记本，看到你这么激动，我好想和你击个掌！把这份能量存起来，未来的某一天它会变成你前行的燃料。',
    ],
    难过: [
      '亲爱的日记本，今天也许不太美好，但你依然值得被温柔对待。难过是心灵在告诉你：你在乎。给自己一个拥抱，明天会不一样。',
      '亲爱的日记本，所有的情绪都会流过，就像云从天上飘过。你可以是天空，看着这片叫做"难过"的云慢慢移动。它会过去的。',
    ],
    生气: [
      '亲爱的日记本，愤怒是一团火，烧完了就剩下灰烬里那个真正在乎的东西。你生气的背后，是一个有边界、有原则的自己。这一点值得尊重。',
      '亲爱的日记本，今天的气愤说明你是一个活生生的人，不是一台机器。情绪来了，感受它，然后让它走。你比你的愤怒更大。',
    ],
  }

  return pick(insightTemplates[mood])
}

function generateSuggestedMood(messages: Message[]): Mood {
  const userMessages = messages.filter((m) => m.role === 'user')
  if (userMessages.length === 0) return '平静'
  const lastContent = userMessages[userMessages.length - 1].content
  return analyzeMessage(lastContent).primaryMood
}

// ═══════════════════════════════════════════════════════════════════════
// MockAiService — implements AiService
// ═══════════════════════════════════════════════════════════════════════

export const mockAiService: AiService = {
  // ── Streaming Chat ──
  async *chatStream(
    messages: Message[],
    _options?: ChatOptions,
  ): AsyncGenerator<ChatStreamChunk> {
    // Simulate initial "thinking" delay (800-1500ms, feels natural)
    const thinkingDelay = 800 + Math.random() * 700
    await delay(thinkingDelay)

    const lastUserMessage = messages
      .filter((m) => m.role === 'user')
      .slice(-1)[0]

    if (!lastUserMessage) {
      const fallback = '嗨～今天想聊点什么呀？'
      yield* streamText(fallback)
      return
    }

    const response = buildResponse(lastUserMessage.content)
    yield* streamText(response)
  },

  // ── Diary Generation ──
  async generateDiary(messages: Message[]): Promise<DiaryGeneration> {
    // Simulate AI "thinking" time (1-2s — diary generation is heavier)
    await delay(1000 + Math.random() * 1000)

    const userMessages = messages.filter((m) => m.role === 'user')
    if (userMessages.length === 0) {
      return {
        title: '空白的日记',
        content: '今天还没有和 Echo 聊过什么。去聊聊天吧，日记会自动生成哦。',
        insight: '亲爱的日记本，每一篇日记都从一句话开始。去和 Echo 打个招呼吧～',
        suggestedMood: '平静',
      }
    }

    return {
      title: generateDiaryTitle(messages),
      content: generateDiaryContent(messages),
      insight: generateDiaryInsight(messages),
      suggestedMood: generateSuggestedMood(messages),
    }
  },

  // ── Insight Generation ──
  async generateInsight(
    diaryContent: string,
    mood: Mood | null,
  ): Promise<string> {
    await delay(600 + Math.random() * 600)

    const effectiveMood = mood ?? '平静'

    const insights: Record<Mood, string[]> = {
      开心: [
        '亲爱的日记本，回头看这篇日记，还是能感受到那天阳光的味道。快乐的记忆是储蓄罐里的金币，随时可以拿出来取暖。',
        '亲爱的日记本，每一行字都闪着光。记录快乐不是炫耀，而是给未来的自己留一盏灯。',
      ],
      平静: [
        '亲爱的日记本，重读这些平静的文字，像是听见了那天窗外的风声。安静本身就是一种力量，你在那一天拥有了它。',
        '亲爱的日记本，平淡的日子里藏着最深的智慧。你那天不急不躁，和世界温柔相处。这很了不起。',
      ],
      思考: [
        '亲爱的日记本，那天你在认真思考。现在回头看，有些问题也许已经有了答案，有些还在路上。无论如何，你一直在成长。',
        '亲爱的日记本，这些文字记录了一次心灵上的探索。感谢那天的自己愿意停下来想一想，才有了现在的方向。',
      ],
      兴奋: [
        '亲爱的日记本，读这篇日记的时候，那种激动又涌上来了！好的日子值得反复回味，它是你人生故事里的高光页码。',
        '亲爱的日记本，那天的快乐现在还热乎着呢。多好的瞬间，多好的你。',
      ],
      难过: [
        '亲爱的日记本，那天也许不太好过。但现在回头看，你已经走了这么远。那些让你哭的事情，最终都变成了你的铠甲。',
        '亲爱的日记本，感谢那天的自己，即使难过也没有放弃表达。这篇日记是你送给自己的一份温柔。',
      ],
      生气: [
        '亲爱的日记本，现在再看那天的愤怒，也许会心一笑。情绪是客人，来了又走，但你始终在这里。你已经平静下来了，这就是进步。',
        '亲爱的日记本，那天的不爽已经被时间冲淡了。留下的不是愤怒本身，而是你学会的：有些事不值得。',
      ],
    }

    return pick(insights[effectiveMood])
  },
}
