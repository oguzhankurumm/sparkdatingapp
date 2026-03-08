'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, Button, Skeleton } from '@spark/ui'
import {
  ArrowLeft,
  Bell,
  BellRinging,
  CheckCircle,
  Trash,
  Heart,
  ChatCircle,
  Star,
  Gift,
  PhoneX,
  Timer,
  Lightning,
  Broadcast,
  UsersThree,
  Medal,
  UserPlus,
} from '@phosphor-icons/react'
import {
  useNotificationsList,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '@/lib/hooks/use-notifications'
import type { NotificationItem } from '@spark/ui'

// ──────────────────────────────────────────────
// Icon mapping (same as NotificationRow molecule)
// ──────────────────────────────────────────────

const notificationIcons: Record<string, { icon: typeof Heart; color: string }> = {
  match: { icon: Heart, color: 'text-like' },
  message: { icon: ChatCircle, color: 'text-primary' },
  like: { icon: Heart, color: 'text-like' },
  super_like: { icon: Star, color: 'text-super-like' },
  gift: { icon: Gift, color: 'text-amber-500' },
  call_missed: { icon: PhoneX, color: 'text-error' },
  match_expiry: { icon: Timer, color: 'text-warning' },
  boost_ended: { icon: Lightning, color: 'text-boost' },
  stream_started: { icon: Broadcast, color: 'text-primary' },
  table_invite: { icon: UsersThree, color: 'text-secondary' },
  badge_earned: { icon: Medal, color: 'text-amber-500' },
  referral_joined: { icon: UserPlus, color: 'text-success' },
  system: { icon: Bell, color: 'text-text-secondary' },
}

// ──────────────────────────────────────────────
// Notifications Page
// ──────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter()
  const [page, setPage] = useState(0)
  const limit = 30

  const { data, isLoading } = useNotificationsList(limit, page * limit)
  const { data: unreadData } = useUnreadCount()
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()
  const deleteNotification = useDeleteNotification()

  const notifications = data?.data ?? []
  const total = data?.total ?? 0
  const unreadCount = unreadData?.count ?? 0
  const hasMore = (page + 1) * limit < total

  function handleNotificationClick(notification: NotificationItem) {
    if (!notification.read) {
      markAsRead.mutate(notification.id)
    }

    // Route based on notification type
    switch (notification.type) {
      case 'match':
      case 'like':
      case 'super_like':
        router.push('/matches')
        break
      case 'message':
        router.push('/matches')
        break
      case 'call_missed':
        router.push('/calls')
        break
      case 'table_invite':
        router.push('/tables')
        break
      case 'stream_started':
        router.push('/discover')
        break
      default:
        // system, badge_earned, etc. — stay on notifications page
        break
    }
  }

  return (
    <div className="mx-auto max-w-2xl pb-24">
      {/* ─── Top bar ─── */}
      <div className="border-border sticky top-0 z-10 flex items-center justify-between border-b bg-[var(--surface-glass)] px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-text-muted hover:text-text-primary flex h-9 w-9 items-center justify-center rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-text-primary text-lg font-bold">Notifications</h1>
            {unreadCount > 0 && <p className="text-text-muted text-xs">{unreadCount} unread</p>}
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead.mutate()}
            className="text-primary flex items-center gap-1.5 text-sm font-medium"
          >
            <CheckCircle className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* ─── Notification list ─── */}
      {isLoading ? (
        <NotificationsSkeleton />
      ) : notifications.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="divide-border divide-y">
          {notifications.map((notification) => {
            const iconConfig = notificationIcons[notification.type] ?? notificationIcons.system!
            const Icon = iconConfig.icon

            return (
              <div
                key={notification.id}
                className={`group flex items-start gap-3 px-4 py-4 transition-colors ${
                  notification.read ? '' : 'bg-primary-light/30'
                }`}
              >
                {/* Click target: avatar + content */}
                <button
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left"
                >
                  {/* Avatar or icon */}
                  <div className="relative shrink-0">
                    {notification.actor ? (
                      <Avatar
                        src={notification.actor.avatarUrl}
                        fallback={notification.actor.firstName}
                        size="md"
                      />
                    ) : (
                      <div className="bg-surface flex h-10 w-10 items-center justify-center rounded-full">
                        <Icon size={20} weight="fill" className={iconConfig.color} />
                      </div>
                    )}

                    {notification.actor && (
                      <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-white dark:border-[var(--surface)] dark:bg-[var(--surface)]">
                        <Icon size={10} weight="fill" className={iconConfig.color} />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm leading-snug ${
                        notification.read ? 'text-text-secondary' : 'text-text-primary font-medium'
                      }`}
                    >
                      {notification.title}
                    </p>
                    {notification.body && (
                      <p className="text-text-muted mt-0.5 line-clamp-2 text-xs">
                        {notification.body}
                      </p>
                    )}
                    <span className="text-text-muted mt-1 block text-[10px]">
                      {notification.timestamp}
                    </span>
                  </div>
                </button>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {!notification.read && (
                    <button
                      type="button"
                      onClick={() => markAsRead.mutate(notification.id)}
                      className="text-text-muted hover:text-primary flex h-7 w-7 items-center justify-center rounded-full transition-colors"
                      aria-label="Mark as read"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteNotification.mutate(notification.id)}
                    className="text-text-muted hover:text-error flex h-7 w-7 items-center justify-center rounded-full transition-colors"
                    aria-label="Delete notification"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>

                {/* Unread dot */}
                {!notification.read && (
                  <div className="bg-primary mt-2 h-2 w-2 shrink-0 rounded-full" />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ─── Pagination ─── */}
      {total > limit && (
        <div className="flex items-center justify-center gap-3 px-4 py-6">
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <span className="text-text-muted text-xs">
            Page {page + 1} of {Math.ceil(total / limit)}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20">
      <div className="bg-surface mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        <BellRinging className="text-text-muted h-8 w-8" />
      </div>
      <h2 className="text-text-primary mb-1 text-lg font-semibold">All caught up!</h2>
      <p className="text-text-muted text-center text-sm">
        You&apos;ll see new likes, matches, and messages here.
      </p>
    </div>
  )
}

function NotificationsSkeleton() {
  return (
    <div className="divide-border divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-4">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
