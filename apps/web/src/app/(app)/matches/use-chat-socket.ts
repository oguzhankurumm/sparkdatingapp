'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { matchKeys } from './hooks'
import type {
  SocketMessageEvent,
  SocketTypingEvent,
  SocketReadEvent,
  Message,
  MessagesResponse,
} from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const TOKEN_KEY = 'spark_access_token'

interface UseChatSocketOptions {
  matchId: string
  enabled?: boolean
}

interface UseChatSocketReturn {
  isConnected: boolean
  isPartnerTyping: boolean
  sendTypingStart: () => void
  sendTypingStop: () => void
}

/**
 * Socket.io hook for real-time chat features.
 * Connects to the /chat namespace and handles:
 * - message:new — appends new messages to the query cache
 * - message:read — updates read receipts
 * - typing:start / typing:stop — partner typing indicator
 */
export function useChatSocket({
  matchId,
  enabled = true,
}: UseChatSocketOptions): UseChatSocketReturn {
  const queryClient = useQueryClient()
  const socketRef = useRef<Socket | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isPartnerTyping, setIsPartnerTyping] = useState(false)

  useEffect(() => {
    if (!enabled || !matchId) return

    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null

    if (!token) return

    const socket = io(`${API_URL}/chat`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    // ── Connection lifecycle ──
    socket.on('connect', () => {
      setIsConnected(true)
      socket.emit('room:join', { matchId })
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    // ── Message events ──
    socket.on('message:new', (data: SocketMessageEvent) => {
      if (data.matchId !== matchId) return

      // Append the new message to the infinite query cache
      queryClient.setQueryData<{
        pages: MessagesResponse[]
        pageParams: (string | undefined)[]
      }>(matchKeys.messages(matchId), (old) => {
        if (!old) return old

        const firstPage = old.pages[0]
        if (!firstPage) return old

        // Check for duplicates (in case we already have it from our own mutation)
        const exists = firstPage.messages.some((m: Message) => m.id === data.message.id)
        if (exists) return old

        return {
          ...old,
          pages: [
            {
              ...firstPage,
              messages: [...firstPage.messages, data.message],
            },
            ...old.pages.slice(1),
          ],
        }
      })

      // Update the matches list to show latest message
      queryClient.invalidateQueries({ queryKey: matchKeys.list() })
    })

    socket.on('message:read', (data: SocketReadEvent) => {
      if (data.matchId !== matchId) return

      // Update read status in cached messages
      queryClient.setQueryData<{
        pages: MessagesResponse[]
        pageParams: (string | undefined)[]
      }>(matchKeys.messages(matchId), (old) => {
        if (!old) return old

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            messages: page.messages.map((msg: Message) =>
              data.messageIds.includes(msg.id) ? { ...msg, readAt: data.readAt } : msg,
            ),
          })),
        }
      })
    })

    // ── Typing events ──
    socket.on('typing:start', (data: SocketTypingEvent) => {
      if (data.matchId !== matchId) return
      setIsPartnerTyping(true)
    })

    socket.on('typing:stop', (data: SocketTypingEvent) => {
      if (data.matchId !== matchId) return
      setIsPartnerTyping(false)
    })

    // ── Cleanup ──
    return () => {
      socket.emit('room:leave', { matchId })
      socket.disconnect()
      socketRef.current = null
      setIsConnected(false)
      setIsPartnerTyping(false)

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
    }
  }, [matchId, enabled, queryClient])

  const sendTypingStart = useCallback(() => {
    socketRef.current?.emit('typing:start', { matchId })

    // Auto-stop typing after 2 seconds of no keystrokes
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing:stop', { matchId })
      typingTimeoutRef.current = null
    }, 2000)
  }, [matchId])

  const sendTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    socketRef.current?.emit('typing:stop', { matchId })
  }, [matchId])

  return {
    isConnected,
    isPartnerTyping,
    sendTypingStart,
    sendTypingStop,
  }
}
