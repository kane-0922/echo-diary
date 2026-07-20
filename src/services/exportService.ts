// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Export Service
// Markdown generation and file download for diary entries.
// ═══════════════════════════════════════════════════════════════════════

import type { DiaryEntry } from '../types'
import { MOOD_EMOJI } from '../types'

/**
 * Convert a DiaryEntry to a well-formatted Markdown string.
 */
export function diaryToMarkdown(diary: DiaryEntry): string {
  const moodLine = diary.mood
    ? `${MOOD_EMOJI[diary.mood]} 心情：${diary.mood}`
    : ''

  const lines = [
    `# ${diary.title}`,
    '',
    `📅 ${diary.date}`,
    moodLine,
    '',
    '---',
    '',
    diary.content,
    '',
    '---',
    '',
    '### 💬 Echo 说',
    '',
    `> ${diary.aiInsight.replace(/\n/g, '\n> ')}`,
    '',
    '---',
    '',
    `*由 EchoDiary 生成 — ${new Date().toLocaleDateString('zh-CN')}*`,
  ]

  return lines.join('\n')
}

/**
 * Trigger a file download in the browser.
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType = 'text/markdown;charset=utf-8',
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'

  document.body.appendChild(anchor)
  anchor.click()

  // Clean up
  setTimeout(() => {
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }, 100)
}

/**
 * Export a diary entry as a Markdown file.
 */
export function exportDiary(diary: DiaryEntry): void {
  const markdown = diaryToMarkdown(diary)
  const safeTitle = diary.title.replace(/[<>:"/\\|?*]/g, '_').slice(0, 40)
  const filename = `${diary.date}_${safeTitle}.md`
  downloadFile(markdown, filename)
}
