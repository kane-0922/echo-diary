// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Keyword Dictionary
// Chinese emotion / activity / time keywords for Mock AI analysis.
// Maps keyword categories to detected intent for routing templates.
// ═══════════════════════════════════════════════════════════════════════

import type { Mood } from '../types'

// ── Emotion Keywords ──

export const EMOTION_KEYWORDS: Record<Mood, string[]> = {
  开心: [
    '开心', '高兴', '快乐', '幸福', '太好了', '哈哈', '嘻嘻', '棒', '赞',
    '满足', '欣慰', '舒服', '顺利', '成功', '完成', 'nice', 'yeah', '🎉',
    '好开心', '真不错', '美滋滋', '爽', '赞一个', '完美', '给力',
  ],
  平静: [
    '平静', '安静', '放松', '悠闲', '舒适', '淡定', '还好', '还行',
    '一般', '正常', '普普通通', '平淡', '安稳', '宁静', '惬意',
    '喝咖啡', '散步', '看书', '听音乐', '晒太阳',
  ],
  思考: [
    '思考', '想', '反思', '琢磨', '觉得', '感觉', '也许', '可能',
    '不知道', '纠结', '犹豫', '迷茫', '困惑', '探索', '疑问',
    '为什么', '怎么办', '怎么选', '到底', '人生', '意义', '方向',
  ],
  兴奋: [
    '兴奋', '激动', '期待', '太棒了', '等不及', '迫不及待', '超级',
    '非常', '特别', '极了', '厉害', '牛', '好激动', '盼望',
    '梦想成真', '终于', '哇', '！！', '❗', '🤩',
  ],
  难过: [
    '难过', '伤心', '悲伤', '哭', '泪', '失落', '失望', '沮丧',
    '低落', '郁闷', '心塞', '心痛', '遗憾', '可惜', '叹气',
    '不开心', '不好受', '憋屈', '委屈', '无助', '孤单', '寂寞',
  ],
  生气: [
    '生气', '愤怒', '气死', '火大', '恼火', '烦躁', '烦', '讨厌',
    '无语', '受不了', '恶心', '差劲', '糟糕', '崩了', '坑',
    '真烦', '气人', '闹心', '抓狂', '忍不了', '凭什么',
  ],
}

// ── Activity Keywords ──

export const ACTIVITY_KEYWORDS: Record<string, string[]> = {
  work: ['工作', '上班', '开会', '加班', '项目', '老板', '同事', '客户', 'ddl', '汇报', '方案'],
  study: ['学习', '考试', '上课', '作业', '论文', '复习', '背', '题', '书', '课程'],
  social: ['朋友', '聚会', '吃饭', '约', '聊', '见面', '逛街', '玩', '一起', '群', '微信'],
  family: ['爸妈', '父母', '家里', '妈妈', '爸爸', '家人', '亲戚', '孩子', '回家'],
  health: ['运动', '跑步', '健身', '瑜伽', '身体', '累', '困', '睡', '休息', '医院', '生病'],
  hobby: [
    '游戏', '看剧', '电影', '音乐', '画画', '拍照', '做饭', '烘焙',
    '旅行', '旅游', '猫', '狗', '宠物', '花', '植物', '手工',
  ],
  food: ['吃', '喝', '早餐', '午餐', '晚饭', '奶茶', '咖啡', '火锅', '外卖', '甜点', '美食'],
  tech: ['电脑', '手机', '代码', 'bug', '更新', '下载', 'app', 'AI', '程序'],
}

// ── Diary Intent Keywords ──

export const DIARY_INTENT_KEYWORDS = [
  '写日记', '生成日记', '帮我记录', '记录下来', '写一篇',
  '整理一下', '帮我总结', '做日记', '创建日记', '记录一下',
  '今天的事情', '写下来', '记下来', '总结一下',
]

// ── Analysis Helpers ──

export interface KeywordAnalysis {
  primaryMood: Mood
  secondaryMoods: Mood[]
  activities: string[]
  wantsDiary: boolean
  topicHints: string[]
}

/**
 * Quick keyword scan of the last user message.
 * The real AI would do this implicitly; Mock uses this to pick templates.
 */
export function analyzeMessage(content: string): KeywordAnalysis {
  const lower = content.toLowerCase()

  // Mood detection
  const moodScores = Object.entries(EMOTION_KEYWORDS).map(([mood, keywords]) => {
    const score = keywords.filter((kw) => lower.includes(kw)).length
    return { mood: mood as Mood, score }
  })

  const scored = moodScores.filter((m) => m.score > 0).sort((a, b) => b.score - a.score)
  const primaryMood: Mood = scored[0]?.mood ?? '平静'
  const secondaryMoods = scored.slice(1, 3).map((m) => m.mood)

  // Activity detection
  const activities = Object.entries(ACTIVITY_KEYWORDS).reduce<string[]>(
    (acc, [category, keywords]) => {
      if (keywords.some((kw) => lower.includes(kw))) {
        acc.push(category)
      }
      return acc
    },
    [],
  )

  // Diary intent
  const wantsDiary = DIARY_INTENT_KEYWORDS.some((kw) => lower.includes(kw))

  // Topic hints
  const topicHints: string[] = []
  if (activities.includes('work')) topicHints.push('工作')
  if (activities.includes('study')) topicHints.push('学习')
  if (activities.includes('social')) topicHints.push('社交')
  if (activities.includes('family')) topicHints.push('家庭')
  if (activities.includes('health')) topicHints.push('健康')

  return { primaryMood, secondaryMoods, activities, wantsDiary, topicHints }
}
