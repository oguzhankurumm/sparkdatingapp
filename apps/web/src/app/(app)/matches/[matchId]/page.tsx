'use client'

import { useEffect, useRef, useCallback, useState, Fragment } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, DotsThree, Phone, WarningCircle, Trash, Flag } from '@phosphor-icons/react'
import { Avatar, Button, Skeleton } from '@spark/ui'
import { useCurrentUser } from '@/lib/hooks/use-auth'
import { useMatch, useMessages, useSendMessage, useMarkAsRead, useUnmatch } from '../hooks'
import { useChatSocket } from '../use-chat-socket'
import { ChatMessageBubble, TypingIndicator, DateSeparator } from '../components'
import { ChatInputBar } from '../components/chat-input'
import { isUserOnline, groupMessagesByDate } from '../utils'
import type { Message } from '../types'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.matchId as string

  const { data: currentUser } = useCurrentUser()
  const { data: match, isLoading: isMatchLoading } = useMatch(matchId)
  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMessages(matchId)
  const sendMessage = useSendMessage(matchId)
  const markAsRead = useMarkAsRead(matchId)
  const unmatch = useUnmatch(matchId)

  const { isPartnerTyping, sendTypingStart } = useChatSocket({
    matchId,
    enabled: !!matchId,
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const [showUnmatchConfirm, setShowUnmatchConfirm] = useState(false)
  const prevScrollHeightRef = useRef(0)

  // ── Flatten all messages from paginated data ──
  const allMessages: Message[] = messagesData
    ? messagesData.pages.flatMap((page) => page.messages)
    : []

  // Group messages by date
  const messageGroups = groupMessagesByDate(allMessages)

  // ── Scroll to bottom on new messages ──
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Scroll to bottom when messages first load or new messages arrive
  useEffect(() => {
    if (allMessages.length > 0 && !isFetchingNextPage) {
      scrollToBottom()
    }
  }, [allMessages.length, scrollToBottom, isFetchingNextPage])

  // ── Mark messages as read on mount and when new messages arrive ──
  useEffect(() => {
    if (allMessages.length > 0 && currentUser) {
      const hasUnread = allMessages.some((m) => m.senderId !== currentUser.id && !m.readAt)
      if (hasUnread) {
        markAsRead.mutate()
      }
    }
  }, [allMessages.length, currentUser?.id])

  // ── Infinite scroll — load older messages on scroll up ──
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return

    if (container.scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
      // Store scroll height before loading more
      prevScrollHeightRef.current = container.scrollHeight
      fetchNextPage().then(() => {
        // Restore scroll position after new messages are prepended
        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight
            container.scrollTop = newScrollHeight - prevScrollHeightRef.current
          }
        })
      })
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // ── Send message handler ──
  const handleSend = useCallback(
    (content: string) => {
      if (!content.trim()) return
      sendMessage.mutate({ type: 'text', content: content.trim() })
    },
    [sendMessage],
  )

  // ── Unmatch handler ──
  const handleUnmatch = useCallback(() => {
    unmatch.mutate(undefined, {
      onSuccess: () => {
        router.push('/matches')
      },
    })
  }, [unmatch, router])

  // ── Loading state ──
  if (isMatchLoading || isMessagesLoading) {
    return (
      <div className="bg-background flex h-screen flex-col">
        {/* Header skeleton */}
        <header className="border-border-subtle flex items-center gap-3 border-b px-4 py-3">
          <Skeleton variant="avatar" size="sm" />
          <div className="flex-1 space-y-1.5">
            <Skeleton variant="text" className="h-4 w-24" />
            <Skeleton variant="text" className="h-3 w-16" />
          </div>
        </header>
        {/* Messages skeleton */}
        <div className="flex-1 space-y-4 overflow-hidden px-4 py-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`flex ${i % 3 === 0 ? 'justify-start' : 'justify-end'}`}>
              <Skeleton
                variant="text"
                className={`h-10 rounded-2xl ${i % 2 === 0 ? 'w-48' : 'w-36'}`}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const partner = match?.partner
  const partnerOnline = partner ? isUserOnline(partner.lastActiveAt) : false

  return (
    <div className="bg-background flex h-screen flex-col">
      {/* ── Chat Header ── */}
      <header className="border-border-subtle sticky top-0 z-50 flex items-center gap-3 border-b bg-[var(--surface-glass)] px-4 py-3 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => router.push('/matches')}
          className="text-text-secondary hover:bg-surface rounded-full p-1"
          aria-label="Back to matches"
        >
          <ArrowLeft size={22} />
        </button>

        <Avatar
          src={partner?.avatarUrl}
          fallback={partner?.firstName ?? '?'}
          size="sm"
          online={partnerOnline}
          verified={partner?.isVerified}
        />

        <div className="min-w-0 flex-1">
          <h2 className="text-text-primary truncate text-sm font-semibold">
            {partner?.firstName ?? 'Match'}
          </h2>
          {partnerOnline && <p className="text-success text-xs">Online</p>}
        </div>

        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => {
              // Video call comes in a later issue
            }}
            className="text-text-secondary hover:bg-surface rounded-full p-2"
            aria-label="Start video call"
          >
            <Phone size={20} />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowOptionsMenu((prev) => !prev)}
              className="text-text-secondary hover:bg-surface rounded-full p-2"
              aria-label="More options"
            >
              <DotsThree size={20} weight="bold" />
            </button>

            {/* Options dropdown */}
            <AnimatePresence>
              {showOptionsMenu && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowOptionsMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="border-border-subtle bg-surface-elevated absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border py-1 shadow-lg"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowOptionsMenu(false)
                        setShowUnmatchConfirm(true)
                      }}
                      className="text-danger hover:bg-danger/5 flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors"
                    >
                      <Trash size={16} />
                      Unmatch
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOptionsMenu(false)
                        // Report functionality comes later
                      }}
                      className="text-text-secondary hover:bg-surface flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors"
                    >
                      <Flag size={16} />
                      Report
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── Unmatch Confirmation Modal ── */}
      <AnimatePresence>
        {showUnmatchConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowUnmatchConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-elevated w-full max-w-sm rounded-2xl p-6"
            >
              <div className="mb-4 flex justify-center">
                <div className="bg-danger/10 flex h-12 w-12 items-center justify-center rounded-full">
                  <WarningCircle size={28} className="text-danger" />
                </div>
              </div>
              <h3 className="text-text-primary text-center text-lg font-semibold">
                Unmatch {partner?.firstName}?
              </h3>
              <p className="text-text-muted mt-2 text-center text-sm">
                This will permanently remove this match and all messages. This action cannot be
                undone.
              </p>
              <div className="mt-6 flex gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setShowUnmatchConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleUnmatch}
                  disabled={unmatch.isPending}
                  className="!bg-danger hover:!bg-danger/90 flex-1"
                >
                  {unmatch.isPending ? 'Unmatching...' : 'Unmatch'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Messages Area ── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {/* Loading older messages indicator */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-3">
            <div className="border-border border-t-primary h-5 w-5 animate-spin rounded-full border-2" />
          </div>
        )}

        {/* Empty messages state */}
        {allMessages.length === 0 && !isMessagesLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-text-muted text-sm">You matched with {partner?.firstName}!</p>
            <p className="text-text-muted mt-1 text-sm">
              Send a message to start the conversation.
            </p>
          </div>
        )}

        {/* Message groups by date */}
        {messageGroups.map((group) => (
          <Fragment key={group.date}>
            <DateSeparator label={group.label} />
            <div className="space-y-2">
              {group.messages.map((message) => (
                <ChatMessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === currentUser?.id}
                />
              ))}
            </div>
          </Fragment>
        ))}

        {/* Typing indicator */}
        <TypingIndicator isVisible={isPartnerTyping} name={partner?.firstName} />

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Chat Input ── */}
      <ChatInputBar
        onSend={handleSend}
        onTyping={sendTypingStart}
        disabled={sendMessage.isPending}
      />
    </div>
  )
}
