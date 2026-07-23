// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Diary Edit Page
// Edit title / date / mood / content, Echo insight, save / delete / export.
// ═══════════════════════════════════════════════════════════════════════

import { useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import { exportDiary } from '../../services/exportService'
import { nowISO } from '../../utils/idGenerator'
import type { Mood, DiaryEntry } from '../../types'
import MoodPicker from './MoodPicker'
import DiaryEditor from './DiaryEditor'
import EchoInsight from './EchoInsight'
import ConfirmDialog from '../shared/ConfirmDialog'
import styles from './DiaryEditPage.module.css'

// ── Inline SVG Icons ──

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-8-8 8-8" />
    </svg>
  )
}

export default function DiaryEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { state, actions } = useApp()

  // ── Load diary ──
  const diary = useMemo(
    () => state.diaryEntries.find((d) => d.id === id) ?? null,
    [state.diaryEntries, id],
  )

  // ── Local editing state (initialised from diary) ──
  const [title, setTitle] = useState(diary?.title ?? '')
  const [content, setContent] = useState(diary?.content ?? '')
  const [date, setDate] = useState(diary?.date ?? '')
  const [mood, setMood] = useState<Mood | null>(diary?.mood ?? null)
  const [insight, setInsight] = useState(diary?.aiInsight ?? '')

  // ── Confirm dialogs ──
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Track if any field has changed
  const hasChanges = useMemo(() => {
    if (!diary) return false
    return (
      title !== diary.title ||
      content !== diary.content ||
      date !== diary.date ||
      mood !== diary.mood ||
      insight !== diary.aiInsight
    )
  }, [diary, title, content, date, mood, insight])

  // ── Save ──
  const handleSave = useCallback(() => {
    if (!diary) return

    const updated: DiaryEntry = {
      ...diary,
      title: title.trim() || '未命名日记',
      content,
      date,
      mood,
      aiInsight: insight,
      updatedAt: nowISO(),
    }

    actions.updateDiary(updated)
    actions.showToast('success', '保存成功 ✅')
  }, [diary, title, content, date, mood, insight, actions, navigate])

  // ── Delete ──
  const handleDelete = useCallback(() => {
    if (!diary) return
    actions.deleteDiary(diary.id)
    actions.showToast('info', '日记已删除')
    navigate('/diaries', { replace: true })
  }, [diary, actions, navigate])

  // ── Export ──
  const handleExport = useCallback(() => {
    if (!diary) return
    const exportEntry: DiaryEntry = {
      ...diary,
      title: title.trim() || diary.title,
      content,
      date,
      mood,
      aiInsight: insight,
      updatedAt: nowISO(),
    }
    exportDiary(exportEntry)
    actions.showToast('success', '日记已导出为 Markdown 📥')
  }, [diary, title, content, date, mood, insight, actions])

  // ── Not Found ──
  if (!diary) {
    return (
      <div className={styles.page}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <button className={styles.backBtn} onClick={() => navigate(-1)}>
              <ArrowLeftIcon />
              返回
            </button>
          </div>
        </div>
        <div className={styles.loading}>
          <p>找不到这篇日记 😕</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeftIcon />
            <span className={styles.btnLabel}>返回</span>
          </button>
          <h1 className={styles.toolbarTitle}>编辑日记</h1>
        </div>
        <div className={styles.toolbarRight}>
          <button
            className={styles.toolBtnDanger}
            onClick={() => setShowDeleteConfirm(true)}
          >
            <span className={styles.btnLabel}>删除</span>
          </button>
          <button className={styles.toolBtnGhost} onClick={handleExport}>
            <span className={styles.btnLabel}>导出</span>
          </button>
          <button
            className={styles.toolBtnPrimary}
            onClick={handleSave}
            disabled={!hasChanges}
            style={!hasChanges ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            保存
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className={styles.body}>
        <div className={styles.container}>
          {/* Meta: Date + Mood */}
          <div className={styles.metaSection}>
            <div className={styles.dateField}>
              <label className={styles.dateLabel} htmlFor="diary-date">
                日期
              </label>
              <input
                id="diary-date"
                className={styles.dateInput}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className={styles.moodSection}>
              <span className={styles.moodLabel}>心情</span>
              <MoodPicker selected={mood} onChange={setMood} />
            </div>
          </div>

          {/* Editor */}
          <DiaryEditor
            title={title}
            content={content}
            onTitleChange={setTitle}
            onContentChange={setContent}
          />

          {/* Echo Insight */}
          <EchoInsight
            insight={insight}
            diaryContent={content}
            mood={mood}
            onInsightChange={setInsight}
          />
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="删除日记"
        message="删除后无法恢复。确定要删除这篇日记吗？"
        confirmLabel="删除"
        cancelLabel="保留"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
