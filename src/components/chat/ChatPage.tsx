// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Chat Page
// The core interaction page. Orchestrates messages, streaming AI
// responses, and diary generation.
// ═══════════════════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import { generateId, nowISO, todayDate } from '../../utils/idGenerator'
import type { Message, DiaryEntry } from '../../types'
import { ECHO_NUDGE_PROMPT } from '../../ai/prompts/echoNudge'
import ChatHeader from './ChatHeader'
import ChatMessageList from './ChatMessageList'
import ChatInput from './ChatInput'
import styles from './ChatPage.module.css'

export default function ChatPage() {
  const { state, dispatch, actions, aiService } = useApp()
  const navigate = useNavigate()

  const [isStreaming, setIsStreaming] = useState(false)
  const [isGeneratingDiary, setIsGeneratingDiary] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [errorMessageId, setErrorMessageId] = useState<string | null>(null)

  // Abort controller for cancelling streaming
  const abortRef = useRef<AbortController | null>(null)

  // Get current session messages
  const activeSession = state.chatSessions.find(
    (s) => s.id === state.activeChatId,
  )
  const messages = activeSession?.messages ?? []

  // If no active session (shouldn't happen after hydration), create one
  useEffect(() => {
    if (!state.activeChatId) {
      actions.createSession()
    }
  }, [state.activeChatId, actions])

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  // ── Send Message + Stream Response ──

  const handleSend = useCallback(
    async (content: string) => {
      const sessionId = state.activeChatId
      if (!sessionId || !content.trim()) return

      // Clear any previous error
      setErrorMessageId(null)

      // Add user message
      actions.sendMessage(sessionId, content.trim())

      // Add AI placeholder message for streaming
      const aiMsgId = generateId('msg')
      const aiPlaceholder: Message = {
        id: aiMsgId,
        role: 'ai',
        content: '',
        timestamp: nowISO(),
      }
      dispatch({
        type: 'SEND_MESSAGE',
        payload: { sessionId, message: aiPlaceholder },
      })

      // Start streaming
      setStreamingMessageId(aiMsgId)
      setIsStreaming(true)

      // Get updated messages (user message + placeholder)
      const currentMessages = [
        ...messages,
        { id: 'temp', role: 'user' as const, content: content.trim(), timestamp: nowISO() },
      ]

      try {
        abortRef.current = new AbortController()
        const signal = abortRef.current.signal

        for await (const chunk of aiService.chatStream(currentMessages)) {
          if (signal.aborted) break
          if (chunk.done) break
          if (chunk.delta) {
            actions.appendToLastAiMessage(sessionId, chunk.delta)
          }
        }
      } catch {
        setErrorMessageId(aiMsgId)
        actions.showToast('error', 'Echo 暂时无法回应，请检查网络后重试')
      } finally {
        setIsStreaming(false)
        setStreamingMessageId(null)
        abortRef.current = null
      }
    },
    [state.activeChatId, messages, actions, dispatch, aiService],
  )

  // ── Retry ──

  const handleRetry = useCallback(
    (messageId: string) => {
      // Find the user message before this AI message
      const session = state.chatSessions.find(
        (s) => s.id === state.activeChatId,
      )
      if (!session) return

      const msgIndex = session.messages.findIndex((m) => m.id === messageId)
      if (msgIndex <= 0) return

      const prevUserMsg = session.messages
        .slice(0, msgIndex)
        .reverse()
        .find((m) => m.role === 'user')

      if (prevUserMsg) {
        // Remove the failed AI message and retry
        // (simplified: just resend the last user message)
        handleSend(prevUserMsg.content)
      }
    },
    [state.activeChatId, state.chatSessions, handleSend],
  )

  // ── Empty-state Prompt Click ──

  const handlePromptClick = useCallback(
    (prompt: string) => {
      handleSend(prompt)
    },
    [handleSend],
  )

  // ── Echo Nudge — Echo 主动发起话题引导 ──

  const handleEchoNudge = useCallback(async () => {
    const sessionId = state.activeChatId
    if (!sessionId || isStreaming) return

    const hasUserMessages = messages.some((m) => m.role === 'user')

    // 无用户消息：Echo 直接发一条冰破消息，不需要调 AI
    if (!hasUserMessages) {
      const echoMsg: Message = {
        id: generateId('msg'),
        role: 'ai',
        content: '嗨～你有什么想和我聊的嘛？😊',
        timestamp: nowISO(),
      }
      dispatch({
        type: 'SEND_MESSAGE',
        payload: { sessionId, message: echoMsg },
      })
      return
    }

    // 有聊天记录：调 AI，让 Echo 基于上下文生成话题引导
    const aiMsgId = generateId('msg')
    const aiPlaceholder: Message = {
      id: aiMsgId,
      role: 'ai',
      content: '',
      timestamp: nowISO(),
    }
    dispatch({
      type: 'SEND_MESSAGE',
      payload: { sessionId, message: aiPlaceholder },
    })

    setStreamingMessageId(aiMsgId)
    setIsStreaming(true)

    try {
      abortRef.current = new AbortController()
      const signal = abortRef.current.signal

      for await (const chunk of aiService.chatStream(messages, {
        systemPrompt: ECHO_NUDGE_PROMPT,
      })) {
        if (signal.aborted) break
        if (chunk.done) break
        if (chunk.delta) {
          actions.appendToLastAiMessage(sessionId, chunk.delta)
        }
      }
    } catch {
      setErrorMessageId(aiMsgId)
      actions.showToast('error', 'Echo 暂时无法回应，请检查网络后重试')
    } finally {
      setIsStreaming(false)
      setStreamingMessageId(null)
      abortRef.current = null
    }
  }, [state.activeChatId, isStreaming, messages, actions, dispatch, aiService])

  // ── Generate Diary ──

  const canGenerateDiary = messages.filter((m) => m.role === 'user').length >= 1

  const handleGenerateDiary = useCallback(async () => {
    if (!canGenerateDiary || isGeneratingDiary) return

    const sessionId = state.activeChatId
    if (!sessionId) return

    setIsGeneratingDiary(true)

    try {
      const generation = await aiService.generateDiary(messages)

      const diary: DiaryEntry = {
        id: generateId('diary'),
        chatSessionId: sessionId,
        title: generation.title,
        date: todayDate(),
        mood: generation.suggestedMood ?? null,
        content: generation.content,
        aiInsight: generation.insight,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      }

      actions.saveDiary(diary)
      actions.showToast('success', '日记草稿已生成 ✨')
      navigate(`/diary/${diary.id}/edit`)
    } catch {
      actions.showToast('error', '生成日记失败，请稍后重试')
    } finally {
      setIsGeneratingDiary(false)
    }
  }, [
    canGenerateDiary,
    isGeneratingDiary,
    state.activeChatId,
    messages,
    aiService,
    actions,
    navigate,
  ])

  // ── Render ──

  return (
    <div className={styles.page}>
      <ChatHeader
        isStreaming={isStreaming}
        onGenerateDiary={handleGenerateDiary}
        isGeneratingDiary={isGeneratingDiary}
        canGenerateDiary={canGenerateDiary}
      />
      <ChatMessageList
        messages={messages}
        streamingMessageId={streamingMessageId}
        errorMessageId={errorMessageId}
        onRetry={handleRetry}
        onPromptClick={handlePromptClick}
      />
      <ChatInput
        onSend={handleSend}
        onEchoNudge={handleEchoNudge}
        isStreaming={isStreaming}
      />
    </div>
  )
}
