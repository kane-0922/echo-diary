// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Diary Editor
// Title + content editing area.
// ═══════════════════════════════════════════════════════════════════════

import styles from './DiaryEditPage.module.css'

interface DiaryEditorProps {
  title: string
  content: string
  onTitleChange: (title: string) => void
  onContentChange: (content: string) => void
}

export default function DiaryEditor({
  title,
  content,
  onTitleChange,
  onContentChange,
}: DiaryEditorProps) {
  return (
    <>
      {/* Title */}
      <input
        className={styles.titleInput}
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="日记标题…"
        aria-label="日记标题"
      />

      {/* Content */}
      <div className={styles.editor}>
        <textarea
          className={styles.editorTextarea}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="今天发生了什么呢？写下你想记住的…"
          aria-label="日记正文"
        />
      </div>
    </>
  )
}
