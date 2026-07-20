// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Core Type Definitions
// ═══════════════════════════════════════════════════════════════════════

// ── Mood ──
export type Mood = '开心' | '平静' | '思考' | '兴奋' | '难过' | '生气'

export const MOODS: Mood[] = ['开心', '平静', '思考', '兴奋', '难过', '生气']

export const MOOD_EMOJI: Record<Mood, string> = {
  开心: '😊',
  平静: '😌',
  思考: '🤔',
  兴奋: '🎉',
  难过: '😢',
  生气: '😤',
}

export const MOOD_LABEL: Record<Mood, string> = {
  开心: 'Happy',
  平静: 'Calm',
  思考: 'Pensive',
  兴奋: 'Excited',
  难过: 'Sad',
  生气: 'Angry',
}

// ── Message ──
export interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: string // ISO 8601
}

// ── Chat Session ──
export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
}

// ── Diary Entry ──
export interface DiaryEntry {
  id: string
  chatSessionId: string
  title: string
  date: string // ISO 8601 date
  mood: Mood | null
  content: string
  aiInsight: string
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
}

// ── App State ──
export interface AppState {
  chatSessions: ChatSession[]
  activeChatId: string | null
  diaryEntries: DiaryEntry[]
  sidebarOpen: boolean
  toasts: Toast[]
}

// ── Toast ──
export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
  durationMs?: number // default 3000
}

// ── Confirm Dialog ──
export interface ConfirmDialogState {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm?: () => void
}

// ── AI Generation Status ──
export type GenerationStatus = 'idle' | 'streaming' | 'generating' | 'error'

// ── Actions ──
export type AppAction =
  // Chat
  | { type: 'CREATE_SESSION' }
  | { type: 'SWITCH_SESSION'; payload: { sessionId: string } }
  | { type: 'DELETE_SESSION'; payload: { sessionId: string } }
  | { type: 'SEND_MESSAGE'; payload: { sessionId: string; message: Message } }
  | {
      type: 'APPEND_TO_LAST_AI_MESSAGE'
      payload: { sessionId: string; delta: string }
    }
  | { type: 'UPDATE_SESSION_TITLE'; payload: { sessionId: string; title: string } }
  // Diary
  | { type: 'SAVE_DIARY'; payload: { diary: DiaryEntry } }
  | { type: 'UPDATE_DIARY'; payload: { diary: DiaryEntry } }
  | { type: 'DELETE_DIARY'; payload: { diaryId: string } }
  // UI
  | { type: 'TOGGLE_SIDEBAR'; payload?: { open?: boolean } }
  | { type: 'SHOW_TOAST'; payload: { toast: Toast } }
  | { type: 'DISMISS_TOAST'; payload: { toastId: string } }
  // Data
  | { type: 'HYDRATE'; payload: AppState }
