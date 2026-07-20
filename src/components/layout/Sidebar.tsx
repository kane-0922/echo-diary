// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Sidebar
// Brand + navigation + session list + user profile.
// Responsive: fixed panel on desktop, slide-out drawer on mobile.
// ═══════════════════════════════════════════════════════════════════════

import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import styles from './Sidebar.module.css'

// ── Inline SVG Icons (avoids icon library dependency) ──

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6l-4 4V4z" />
    </svg>
  )
}

function DiaryIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
      <path d="M6 8h8M6 12h5" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M10 4v12M4 10h12" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h14M8 6V4h4v2M6 6v11a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6" />
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════

export default function Sidebar() {
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  const isOpen = state.sidebarOpen
  const activeChatId = state.activeChatId

  // Sorted sessions: most recently updated first
  const sortedSessions = [...state.chatSessions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

  function handleNewChat() {
    actions.createSession()
    navigate('/chat')
  }

  function handleSelectSession(sessionId: string) {
    actions.switchSession(sessionId)
    navigate('/chat')
    // Close drawer on mobile after selection
    if (window.innerWidth < 1024) {
      actions.toggleSidebar(false)
    }
  }

  function handleDeleteSession(
    e: React.MouseEvent,
    sessionId: string,
  ) {
    e.stopPropagation()
    actions.deleteSession(sessionId)
  }

  const isChatActive = location.pathname === '/chat'
  const isDiaryActive = location.pathname === '/diaries'

  return (
    <aside
      className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
      aria-label="侧边导航栏"
    >
      {/* ── Brand ── */}
      <div className={styles.brand}>
        <div className={styles.brandIcon} aria-hidden="true">
          🌿
        </div>
        <div className={styles.brandText}>
          <span className={styles.brandName}>EchoDiary</span>
          <span className={styles.brandSub}>AI 数字庇护所</span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className={styles.nav} aria-label="主导航">
        <button
          className={isChatActive ? styles.navItemActive : styles.navItem}
          onClick={() => navigate('/chat')}
        >
          <ChatIcon className={styles.navIcon} />
          <span>聊天</span>
          {state.chatSessions.length > 0 && (
            <span className={styles.navBadge}>
              {state.chatSessions.length}
            </span>
          )}
        </button>
        <button
          className={isDiaryActive ? styles.navItemActive : styles.navItem}
          onClick={() => navigate('/diaries')}
        >
          <DiaryIcon className={styles.navIcon} />
          <span>日记列表</span>
          {state.diaryEntries.length > 0 && (
            <span className={styles.navBadge}>
              {state.diaryEntries.length}
            </span>
          )}
        </button>
      </nav>

      {/* ── Session List ── */}
      <div className={styles.sessionSection}>
        <div className={styles.sessionHeader}>
          <span className={styles.sessionLabel}>历史对话</span>
          <button
            className={styles.newChatBtn}
            onClick={handleNewChat}
            title="新建对话"
            aria-label="新建对话"
          >
            <PlusIcon />
          </button>
        </div>

        <div className={styles.sessionList}>
          {sortedSessions.length === 0 ? (
            <p className={styles.sessionEmpty}>
              还没有对话记录
              <br />
              去和 Echo 聊聊天吧 ☕
            </p>
          ) : (
            sortedSessions.map((session) => (
              <button
                key={session.id}
                className={
                  session.id === activeChatId
                    ? styles.sessionItemActive
                    : styles.sessionItem
                }
                onClick={() => handleSelectSession(session.id)}
              >
                <span className={styles.sessionTitle}>
                  {session.title}
                </span>
                <span
                  className={styles.sessionDelete}
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  title="删除对话"
                  aria-label={`删除对话：${session.title}`}
                  role="button"
                  tabIndex={0}
                >
                  <TrashIcon />
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Profile ── */}
      <div className={styles.profile}>
        <div className={styles.avatar} aria-hidden="true">
          👤
        </div>
        <div className={styles.profileInfo}>
          <p className={styles.profileName}>我的日记本</p>
          <p className={styles.profileHint}>数据仅存储在本设备</p>
        </div>
      </div>
    </aside>
  )
}
