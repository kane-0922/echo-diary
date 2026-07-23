// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Diary List Page
// Searchable, sortable grid of diary cards with skeleton / empty states.
// ═══════════════════════════════════════════════════════════════════════

import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import { useDebounce } from '../../hooks/useDebounce'
import type { DiaryEntry } from '../../types'
import { generateId, nowISO, todayDate } from '../../utils/idGenerator'
import EmptyState from '../shared/EmptyState'
import Skeleton from '../shared/Skeleton'
import DiaryCard from './DiaryCard'
import styles from './DiaryListPage.module.css'
import SearchBar from './SearchBar'

// ── Inline SVG Icon ──

function PlusIcon() {
  return (
    <svg width="40" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10 4v12M4 10h12" />
    </svg>
  )
}

// ── Sort toggle ──

type SortKey = 'updated' | 'created' | 'title'

const SORT_LABELS: Record<SortKey, string> = {
  updated: '最近更新',
  created: '创建时间',
  title: '标题'
}

// ── Search helpers ──

function diaryMatchesQuery(diary: DiaryEntry, query: string): boolean {
  if (!query.trim()) return true
  const q = query.toLowerCase().trim()
  return diary.title.toLowerCase().includes(q) || diary.content.toLowerCase().includes(q) || (diary.mood ?? '').includes(q) || diary.date.includes(q)
}

// ── Skeleton card for loading state ──

function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={styles.cardMeta}>
        <Skeleton variant="circle" width="28px" height="28px" />
        <Skeleton width="100px" height="0.75rem" />
      </div>
      <Skeleton variant="title" className={styles.skelTitle} />
      <Skeleton variant="text" className={styles.skelLine} />
      <Skeleton variant="text" width="40%" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════

export default function DiaryListPage() {
  const navigate = useNavigate()
  const { state, actions } = useApp()

  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('updated')
  const [isHydrated, setIsHydrated] = useState(false)

  // Mark hydrated after first render (so skeleton shows briefly on first load)
  const debouncedQuery = useDebounce(searchValue, 300)

  // Simulate initial hydration flag (in practice the AppProvider hydrates
  // before this renders, but we show skeletons on very first paint).
  useMemo(() => {
    // Use a microtask to flip the flag so the initial render shows skeletons.
    queueMicrotask(() => setIsHydrated(true))
  }, [])

  // ── Filtered + sorted diaries ──

  const filteredDiaries = useMemo(() => {
    let list = state.diaryEntries.filter(d => diaryMatchesQuery(d, debouncedQuery))

    switch (sortBy) {
      case 'created':
        list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'title':
        list = [...list].sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'))
        break
      case 'updated':
      default:
        list = [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        break
    }

    return list
  }, [state.diaryEntries, debouncedQuery, sortBy])

  // ── Handlers ──

  const handleCardClick = useCallback((id: string) => navigate(`/diary/${id}/edit`), [navigate])

  const handleCreateDiary = useCallback(() => {
    const diary: DiaryEntry = {
      id: generateId('diary'),
      chatSessionId: '', // 手动创建，非聊天生成
      title: '',
      date: todayDate(),
      mood: null,
      content: '',
      aiInsight: '',
      createdAt: nowISO(),
      updatedAt: nowISO()
    }
    actions.saveDiary(diary)
    navigate(`/diary/${diary.id}/edit`)
  }, [actions, navigate])

  const handleGoChat = useCallback(() => {
    actions.createSession()
    navigate('/chat')
  }, [actions, navigate])

  // ── Determine page state ──

  const hasDiaries = state.diaryEntries.length > 0
  const hasResults = filteredDiaries.length > 0
  const isSearching = debouncedQuery.trim().length > 0

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header} style={{ paddingLeft: 8 }}>
        <div className={styles.headerTop} style={{ paddingLeft: 56 }}>
          <h1 className={styles.pageTitle}>我的日记</h1>
          <span className={styles.count}>{state.diaryEntries.length} 篇</span>
        </div>

        {/* Search + Sort bar */}
        <div className={styles.toolbar} style={{ paddingLeft: 52 }}>
          <SearchBar value={searchValue} onChange={setSearchValue} />

          <div className={styles.sortGroup}>
            <span className={styles.sortLabel}>排序</span>
            {(['updated', 'created', 'title'] as SortKey[]).map(key => (
              <button key={key} className={sortBy === key ? styles.sortBtnActive : styles.sortBtn} onClick={() => setSortBy(key)}>
                {SORT_LABELS[key]}
              </button>
            ))}
          </div>

          <button className={styles.createBtn} style={{ width: 46, paddingLeft: 2 }} onClick={handleCreateDiary} aria-label="创建新日记">
            <PlusIcon />
            <span className={styles.createLabel}>创建</span>
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className={styles.body}>
        <div className={styles.list} style={{ paddingLeft: 8 }}>
          {/* State 1: Not yet hydrated → skeletons */}
          {!isHydrated && !hasDiaries && (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}

          {/* State 2: No diaries at all → empty state */}
          {isHydrated && !hasDiaries && (
            <EmptyState
              icon="📖"
              title="还没有日记"
              description="去和 Echo 聊聊天吧，聊完之后可以把对话整理成一篇温暖的日记。"
              action={{ label: '去聊天', onClick: handleGoChat }}
            />
          )}

          {/* State 3: Has diaries but search filtered to zero */}
          {isHydrated && hasDiaries && !hasResults && (
            <EmptyState
              icon="🔍"
              title="没有找到匹配的日记"
              description={isSearching ? `没有找到包含「${debouncedQuery}」的日记，试试其他关键词吧。` : undefined}
            />
          )}

          {/* State 4: Has results → card list */}
          {isHydrated && hasResults && filteredDiaries.map(diary => <DiaryCard key={diary.id} diary={diary} onClick={handleCardClick} />)}
        </div>

        {/* New diary FAB (mobile-friendly) */}
        <button className={styles.fab} onClick={handleCreateDiary} aria-label="写新日记" title="写新日记">
          <PlusIcon />
        </button>
      </div>
    </div>
  )
}
