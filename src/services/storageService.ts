// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Storage Service
// Interface + localStorage implementation.
// Designed so swapping to Supabase / IndexedDB only replaces this file.
// ═══════════════════════════════════════════════════════════════════════

import type { AppState, ChatSession, DiaryEntry } from '../types'

// ── Storage Keys ──
const STORAGE_KEYS = {
  chatSessions: 'echo-diary:chatSessions',
  diaryEntries: 'echo-diary:diaryEntries',
  activeChatId: 'echo-diary:activeChatId',
  sidebarOpen: 'echo-diary:sidebarOpen',
} as const

// ── Error Types ──
export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: 'QUOTA_EXCEEDED' | 'UNAVAILABLE' | 'CORRUPTED' | 'UNKNOWN',
  ) {
    super(message)
    this.name = 'StorageError'
  }
}

// ── Storage Service Interface ──
export interface StorageService {
  // Sessions
  getAllSessions(): Promise<ChatSession[]>
  getSession(id: string): Promise<ChatSession | null>
  saveSession(session: ChatSession): Promise<void>
  deleteSession(id: string): Promise<void>

  // Diaries
  getAllDiaries(): Promise<DiaryEntry[]>
  getDiary(id: string): Promise<DiaryEntry | null>
  saveDiary(diary: DiaryEntry): Promise<void>
  deleteDiary(id: string): Promise<void>

  // App state
  getActiveChatId(): Promise<string | null>
  setActiveChatId(id: string | null): Promise<void>
  getSidebarOpen(): Promise<boolean>
  setSidebarOpen(open: boolean): Promise<void>

  // Bulk
  loadAll(): Promise<AppState>
  saveAll(state: AppState): Promise<void>

  // Health
  isAvailable(): boolean
  getRemainingSpace(): number | null
}

// ── localStorage Implementation ──

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    if (
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.code === 22)
    ) {
      throw new StorageError(
        '存储空间不足，请清理一些日记后重试',
        'QUOTA_EXCEEDED',
      )
    }
    throw new StorageError('存储不可用', 'UNAVAILABLE')
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Best-effort removal
  }
}

export class LocalStorageService implements StorageService {
  isAvailable(): boolean {
    try {
      const testKey = '__echo_storage_test__'
      localStorage.setItem(testKey, '1')
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  getRemainingSpace(): number | null {
    // Rough estimate: most browsers allow ~5 MB per origin
    try {
      let used = 0
      for (const key of Object.values(STORAGE_KEYS)) {
        used += (localStorage.getItem(key) || '').length * 2 // UTF-16
      }
      const limit = 5 * 1024 * 1024 // 5 MB
      return Math.max(0, limit - used)
    } catch {
      return null
    }
  }

  // ── Sessions ──

  async getAllSessions(): Promise<ChatSession[]> {
    return safeGet<ChatSession[]>(STORAGE_KEYS.chatSessions, [])
  }

  async getSession(id: string): Promise<ChatSession | null> {
    const sessions = await this.getAllSessions()
    return sessions.find((s) => s.id === id) ?? null
  }

  async saveSession(session: ChatSession): Promise<void> {
    const sessions = await this.getAllSessions()
    const idx = sessions.findIndex((s) => s.id === session.id)
    if (idx >= 0) {
      sessions[idx] = session
    } else {
      sessions.push(session)
    }
    safeSet(STORAGE_KEYS.chatSessions, sessions)
  }

  async deleteSession(id: string): Promise<void> {
    const sessions = await this.getAllSessions()
    safeSet(
      STORAGE_KEYS.chatSessions,
      sessions.filter((s) => s.id !== id),
    )
  }

  // ── Diaries ──

  async getAllDiaries(): Promise<DiaryEntry[]> {
    return safeGet<DiaryEntry[]>(STORAGE_KEYS.diaryEntries, [])
  }

  async getDiary(id: string): Promise<DiaryEntry | null> {
    const diaries = await this.getAllDiaries()
    return diaries.find((d) => d.id === id) ?? null
  }

  async saveDiary(diary: DiaryEntry): Promise<void> {
    const diaries = await this.getAllDiaries()
    const idx = diaries.findIndex((d) => d.id === diary.id)
    if (idx >= 0) {
      diaries[idx] = diary
    } else {
      diaries.push(diary)
    }
    safeSet(STORAGE_KEYS.diaryEntries, diaries)
  }

  async deleteDiary(id: string): Promise<void> {
    const diaries = await this.getAllDiaries()
    safeSet(
      STORAGE_KEYS.diaryEntries,
      diaries.filter((d) => d.id !== id),
    )
  }

  // ── App State ──

  async getActiveChatId(): Promise<string | null> {
    return safeGet<string | null>(STORAGE_KEYS.activeChatId, null)
  }

  async setActiveChatId(id: string | null): Promise<void> {
    if (id === null) {
      safeRemove(STORAGE_KEYS.activeChatId)
    } else {
      safeSet(STORAGE_KEYS.activeChatId, id)
    }
  }

  async getSidebarOpen(): Promise<boolean> {
    return safeGet<boolean>(STORAGE_KEYS.sidebarOpen, true)
  }

  async setSidebarOpen(open: boolean): Promise<void> {
    safeSet(STORAGE_KEYS.sidebarOpen, open)
  }

  // ── Bulk ──

  async loadAll(): Promise<AppState> {
    const [chatSessions, diaryEntries, activeChatId, sidebarOpen] =
      await Promise.all([
        this.getAllSessions(),
        this.getAllDiaries(),
        this.getActiveChatId(),
        this.getSidebarOpen(),
      ])

    return {
      chatSessions,
      diaryEntries,
      activeChatId,
      sidebarOpen,
      toasts: [], // Ephemeral — never persisted
    }
  }

  async saveAll(state: AppState): Promise<void> {
    safeSet(STORAGE_KEYS.chatSessions, state.chatSessions)
    safeSet(STORAGE_KEYS.diaryEntries, state.diaryEntries)
    if (state.activeChatId) {
      safeSet(STORAGE_KEYS.activeChatId, state.activeChatId)
    } else {
      safeRemove(STORAGE_KEYS.activeChatId)
    }
    safeSet(STORAGE_KEYS.sidebarOpen, state.sidebarOpen)
  }
}

// ── Singleton ──

let instance: StorageService | null = null

export function getStorageService(): StorageService {
  if (!instance) {
    instance = new LocalStorageService()
  }
  return instance
}

// Allow injection for testing or future migration
export function setStorageService(svc: StorageService): void {
  instance = svc
}
