import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useCallback, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'
import { api } from '../api-client'
import type { NotificationItem } from '@spark/ui'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface NotificationFromApi {
  id: string
  type: string
  title: string
  body: string | null
  data: unknown
  read: boolean
  createdAt: string
  actor: {
    id: string
    firstName: string
    avatarUrl: string | null
  } | null
}

interface PaginatedNotifications {
  data: NotificationFromApi[]
  total: number
}

// ──────────────────────────────────────────────
// Query keys
// ──────────────────────────────────────────────

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (params?: { limit?: number; offset?: number }) =>
    [...notificationKeys.all, 'list', params ?? {}] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)

  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function toNotificationItem(n: NotificationFromApi): NotificationItem {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    read: n.read,
    createdAt: n.createdAt,
    timestamp: formatRelativeTime(n.createdAt),
    actor: n.actor,
  }
}

// ──────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────

/**
 * Fetch paginated notifications list.
 */
export function useNotificationsList(limit = 20, offset = 0) {
  return useQuery({
    queryKey: notificationKeys.list({ limit, offset }),
    queryFn: async () => {
      const result = await api.get<PaginatedNotifications>(
        `/notifications?limit=${limit}&offset=${offset}`,
      )
      return {
        data: result.data.map(toNotificationItem),
        total: result.total,
      }
    },
    staleTime: 30_000, // 30 seconds
    enabled: api.hasToken(),
  })
}

/**
 * Fetch unread notification count.
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => api.get<{ count: number }>('/notifications/unread-count'),
    staleTime: 30_000,
    refetchInterval: 60_000, // Poll every 60s as fallback
    enabled: api.hasToken(),
  })
}

/**
 * Mark a single notification as read.
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => api.post<void>(`/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

/**
 * Mark all notifications as read.
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post<void>('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

/**
 * Delete a single notification.
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => api.delete<void>(`/notifications/${notificationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

/**
 * Real-time notification listener via Socket.io.
 * Connects to the /notifications namespace and invalidates
 * TanStack Query cache when new notifications arrive.
 */
export function useNotificationSocket() {
  const queryClient = useQueryClient()
  const socketRef = useRef<Socket | null>(null)

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return

    const token = typeof window !== 'undefined' ? localStorage.getItem('spark_access_token') : null
    if (!token) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const socket = io(`${apiUrl}/notifications`, {
      auth: { token },
      transports: ['websocket'],
    })

    socket.on('connect', () => {
      // Connected to /notifications namespace
    })

    socket.on('notification', () => {
      // New notification arrived — invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    })

    socket.on('disconnect', () => {
      // Socket disconnected
    })

    socketRef.current = socket
  }, [queryClient])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return { connect, disconnect }
}
