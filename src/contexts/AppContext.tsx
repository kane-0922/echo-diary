// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — App Context
// Central state management: Context + useReducer + persistence.
// ═══════════════════════════════════════════════════════════════════════

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import type { AppState, AppAction, ChatSession, Message, DiaryEntry, ToastType } from '../types'
import { getStorageService } from '../services/storageService'
import { createAiService, type AiService } from '../ai'
import { generateId, nowISO, todayDate } from '../utils/idGenerator'

// ═══════════════════════════════════════════════════════════════════════
// Initial State
// ═══════════════════════════════════════════════════════════════════════

function createInitialState(): AppState {
  return {
    chatSessions: [],
    activeChatId: null,
    diaryEntries: [],
    sidebarOpen: true,
    toasts: [],
  }
}

/** Create a fresh chat session with a welcome message. */
function createSession(): ChatSession {
  const now = nowISO()
  return {
    id: generateId('session'),
    title: '新的对话',
    messages: [
      {
        id: generateId('msg'),
        role: 'ai',
        content: '嗨～欢迎来到 EchoDiary！我是 Echo，你的数字日记伴侣 🌿\n\n随便聊聊今天发生了什么吧，开心的、烦恼的、无聊的——什么都可以。聊完之后，我可以帮你整理成一篇温暖的日记。',
        timestamp: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Reducer
// ═══════════════════════════════════════════════════════════════════════

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // ── Session Management ──

    case 'CREATE_SESSION': {
      const session = createSession()
      return {
        ...state,
        chatSessions: [session, ...state.chatSessions],
        activeChatId: session.id,
      }
    }

    case 'SWITCH_SESSION': {
      const exists = state.chatSessions.find(
        (s) => s.id === action.payload.sessionId,
      )
      if (!exists) return state
      return { ...state, activeChatId: action.payload.sessionId }
    }

    case 'DELETE_SESSION': {
      const { sessionId } = action.payload
      const filtered = state.chatSessions.filter((s) => s.id !== sessionId)

      // If deleting the active session, switch to another or create new
      let nextActiveId = state.activeChatId
      if (state.activeChatId === sessionId) {
        if (filtered.length > 0) {
          nextActiveId = filtered[0].id
        } else {
          // Will auto-create in the persistence middleware below
          nextActiveId = null
        }
      }

      return {
        ...state,
        chatSessions: filtered,
        activeChatId: nextActiveId,
      }
    }

    // ── Messages ──

    case 'SEND_MESSAGE': {
      const { sessionId, message } = action.payload
      const now = nowISO()
      return {
        ...state,
        chatSessions: state.chatSessions.map((s) => {
          if (s.id !== sessionId) return s
          // Auto-title: use first user message (truncated)
          const isFirstUserMessage =
            s.messages.filter((m) => m.role === 'user').length === 0
          return {
            ...s,
            title: isFirstUserMessage
              ? message.content.slice(0, 30) + (message.content.length > 30 ? '…' : '')
              : s.title,
            messages: [...s.messages, message],
            updatedAt: now,
          }
        }),
      }
    }

    case 'APPEND_TO_LAST_AI_MESSAGE': {
      const { sessionId, delta } = action.payload
      if (!delta) return state
      return {
        ...state,
        chatSessions: state.chatSessions.map((s) => {
          if (s.id !== sessionId) return s
          const messages = [...s.messages]
          const last = messages[messages.length - 1]
          if (last && last.role === 'ai') {
            messages[messages.length - 1] = {
              ...last,
              content: last.content + delta,
            }
          }
          return { ...s, messages, updatedAt: nowISO() }
        }),
      }
    }

    case 'UPDATE_SESSION_TITLE': {
      const { sessionId, title } = action.payload
      return {
        ...state,
        chatSessions: state.chatSessions.map((s) =>
          s.id === sessionId ? { ...s, title, updatedAt: nowISO() } : s,
        ),
      }
    }

    // ── Diaries ──

    case 'SAVE_DIARY': {
      const { diary } = action.payload
      const exists = state.diaryEntries.some((d) => d.id === diary.id)
      return {
        ...state,
        diaryEntries: exists
          ? state.diaryEntries.map((d) => (d.id === diary.id ? diary : d))
          : [diary, ...state.diaryEntries],
      }
    }

    case 'UPDATE_DIARY': {
      const { diary } = action.payload
      return {
        ...state,
        diaryEntries: state.diaryEntries.map((d) =>
          d.id === diary.id ? { ...diary, updatedAt: nowISO() } : d,
        ),
      }
    }

    case 'DELETE_DIARY': {
      return {
        ...state,
        diaryEntries: state.diaryEntries.filter(
          (d) => d.id !== action.payload.diaryId,
        ),
      }
    }

    // ── UI ──

    case 'TOGGLE_SIDEBAR': {
      return {
        ...state,
        sidebarOpen:
          action.payload?.open !== undefined
            ? action.payload.open
            : !state.sidebarOpen,
      }
    }

    case 'SHOW_TOAST': {
      return {
        ...state,
        toasts: [...state.toasts, action.payload.toast],
      }
    }

    case 'DISMISS_TOAST': {
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.payload.toastId),
      }
    }

    // ── Hydration ──

    case 'HYDRATE': {
      return { ...action.payload, toasts: [] }
    }

    default:
      return state
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Action Creators (convenience wrappers so components don't craft payloads)
// ═══════════════════════════════════════════════════════════════════════

export type AppDispatch = (action: AppAction) => void

export interface AppActions {
  // Sessions
  createSession: () => void
  switchSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
  // Messages
  sendMessage: (sessionId: string, content: string) => Message
  appendToLastAiMessage: (sessionId: string, delta: string) => void
  updateSessionTitle: (sessionId: string, title: string) => void
  // Diaries
  saveDiary: (diary: DiaryEntry) => void
  updateDiary: (diary: DiaryEntry) => void
  deleteDiary: (diaryId: string) => void
  // UI
  toggleSidebar: (open?: boolean) => void
  showToast: (type: string, message: string, durationMs?: number) => void
  dismissToast: (toastId: string) => void
}

// ═══════════════════════════════════════════════════════════════════════
// Context
// ═══════════════════════════════════════════════════════════════════════

export interface AppContextValue {
  state: AppState
  dispatch: AppDispatch
  actions: AppActions
  aiService: AiService
}

export const AppContext = createContext<AppContextValue | null>(null)

// ═══════════════════════════════════════════════════════════════════════
// Provider
// ═══════════════════════════════════════════════════════════════════════

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(appReducer, null, createInitialState)
  const storage = getStorageService()
  const aiService = useRef(createAiService())

  // Persist middleware: after every dispatch, save to localStorage
  const dispatch: AppDispatch = useCallback(
    (action: AppAction) => {
      rawDispatch(action)
    },
    [],
  )

  // Persist state changes to localStorage
  const prevStateRef = useRef<AppState>(state)
  useEffect(() => {
    if (prevStateRef.current !== state) {
      prevStateRef.current = state
      storage.saveAll(state).catch(() => {
        // Silent fail — storage errors are handled at the UI level
      })
    }
  }, [state, storage])

  // Hydrate from localStorage on mount
  const hydratedRef = useRef(false)
  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true

    storage.loadAll().then((saved) => {
      // If there are sessions, use saved state
      if (saved.chatSessions.length > 0) {
        rawDispatch({ type: 'HYDRATE', payload: saved })
        return
      }

      // First visit: create initial session
      const session = createSession()
      rawDispatch({
        type: 'HYDRATE',
        payload: {
          ...saved,
          chatSessions: [session],
          activeChatId: session.id,
        },
      })
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Action Creators ──

  const actions: AppActions = {
    createSession: useCallback(() => {
      rawDispatch({ type: 'CREATE_SESSION' })
    }, []),

    switchSession: useCallback((sessionId: string) => {
      rawDispatch({ type: 'SWITCH_SESSION', payload: { sessionId } })
    }, []),

    deleteSession: useCallback((sessionId: string) => {
      rawDispatch({ type: 'DELETE_SESSION', payload: { sessionId } })
    }, []),

    sendMessage: useCallback((sessionId: string, content: string): Message => {
      const message: Message = {
        id: generateId('msg'),
        role: 'user',
        content,
        timestamp: nowISO(),
      }
      rawDispatch({
        type: 'SEND_MESSAGE',
        payload: { sessionId, message },
      })
      return message
    }, []),

    appendToLastAiMessage: useCallback(
      (sessionId: string, delta: string) => {
        rawDispatch({
          type: 'APPEND_TO_LAST_AI_MESSAGE',
          payload: { sessionId, delta },
        })
      },
      [],
    ),

    updateSessionTitle: useCallback(
      (sessionId: string, title: string) => {
        rawDispatch({
          type: 'UPDATE_SESSION_TITLE',
          payload: { sessionId, title },
        })
      },
      [],
    ),

    saveDiary: useCallback((diary: DiaryEntry) => {
      rawDispatch({ type: 'SAVE_DIARY', payload: { diary } })
    }, []),

    updateDiary: useCallback((diary: DiaryEntry) => {
      rawDispatch({ type: 'UPDATE_DIARY', payload: { diary } })
    }, []),

    deleteDiary: useCallback((diaryId: string) => {
      rawDispatch({ type: 'DELETE_DIARY', payload: { diaryId } })
    }, []),

    toggleSidebar: useCallback((open?: boolean) => {
      rawDispatch({ type: 'TOGGLE_SIDEBAR', payload: { open } })
    }, []),

    showToast: useCallback((type: string, message: string, durationMs = 3000) => {
      const id = generateId('toast')
      rawDispatch({
        type: 'SHOW_TOAST',
        payload: { toast: { id, type: type as ToastType, message, durationMs } },
      })
      // Auto-dismiss after duration
      setTimeout(() => {
        rawDispatch({ type: 'DISMISS_TOAST', payload: { toastId: id } })
      }, durationMs)
    }, []),

    dismissToast: useCallback((toastId: string) => {
      rawDispatch({ type: 'DISMISS_TOAST', payload: { toastId } })
    }, []),
  }

  // Memoize context value to prevent unnecessary re-renders
  const value: AppContextValue = {
    state,
    dispatch,
    actions,
    aiService: aiService.current,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// ═══════════════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════════════

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useApp must be used within an <AppProvider>.')
  }
  return ctx
}
