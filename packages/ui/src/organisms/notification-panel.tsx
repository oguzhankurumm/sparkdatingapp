'use client'

import { forwardRef, useState, useRef, useEffect, useCallback } from 'react'
import { Bell, BellRinging, CheckCircle } from '@phosphor-icons/react'
import { cn } from '../utils/cn'
import { NotificationRow } from '../molecules/notification-row'

interface NotificationItem {
  id: string
  type: string
  title: string
  body: string | null
  read: boolean
  createdAt: string
  /** Relative time string, e.g. "2m ago" — caller provides this */
  timestamp: string
  actor: {
    id: string
    firstName: string
    avatarUrl: string | null
  } | null
}

interface NotificationPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  notifications: NotificationItem[]
  unreadCount: number
  onNotificationClick?: (notification: NotificationItem) => void
  onMarkAllRead?: () => void
  onViewAll?: () => void
  /** Controls whether the panel dropdown is open (controlled mode) */
  open?: boolean
  /** Called when the open state should change */
  onOpenChange?: (open: boolean) => void
}

const NotificationPanel = forwardRef<HTMLDivElement, NotificationPanelProps>(
  (
    {
      className,
      notifications,
      unreadCount,
      onNotificationClick,
      onMarkAllRead,
      onViewAll,
      open: controlledOpen,
      onOpenChange,
      ...props
    },
    ref,
  ) => {
    const [internalOpen, setInternalOpen] = useState(false)
    const panelRef = useRef<HTMLDivElement>(null)

    const isOpen = controlledOpen ?? internalOpen
    const setIsOpen = useCallback(
      (value: boolean) => {
        if (onOpenChange) {
          onOpenChange(value)
        } else {
          setInternalOpen(value)
        }
      },
      [onOpenChange],
    )

    // Close on outside click
    useEffect(() => {
      if (!isOpen) return

      function handleClickOutside(e: MouseEvent) {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
          setIsOpen(false)
        }
      }

      function handleEscape(e: KeyboardEvent) {
        if (e.key === 'Escape') setIsOpen(false)
      }

      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }, [isOpen, setIsOpen])

    const hasNotifications = notifications.length > 0
    const BellIcon = unreadCount > 0 ? BellRinging : Bell

    return (
      <div ref={panelRef} className={cn('relative', className)} {...props}>
        {/* Bell trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-text-muted hover:text-text-primary relative flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <BellIcon className="h-5 w-5" weight={unreadCount > 0 ? 'fill' : 'regular'} />
          {unreadCount > 0 ? (
            <span className="bg-like absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </button>

        {/* Dropdown panel */}
        {isOpen ? (
          <div
            ref={ref}
            className={cn(
              'border-border bg-surface-elevated absolute right-0 top-full z-[var(--z-dropdown)] mt-2 w-[360px] overflow-hidden rounded-2xl border shadow-[var(--shadow-lg)]',
              'animate-in fade-in slide-in-from-top-2 duration-200',
            )}
          >
            {/* Header */}
            <div className="border-border flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-text-primary text-base font-semibold">Notifications</h3>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={() => onMarkAllRead?.()}
                  className="text-primary flex items-center gap-1 text-xs font-medium"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              ) : null}
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto">
              {hasNotifications ? (
                notifications.map((n) => (
                  <NotificationRow
                    key={n.id}
                    type={n.type}
                    title={n.title}
                    body={n.body}
                    timestamp={n.timestamp}
                    read={n.read}
                    actor={n.actor}
                    onClick={() => onNotificationClick?.(n)}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <Bell className="text-text-muted mb-2 h-8 w-8" />
                  <p className="text-text-muted text-sm">No notifications yet</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {hasNotifications ? (
              <div className="border-border border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    onViewAll?.()
                  }}
                  className="text-primary hover:bg-surface w-full py-3 text-center text-sm font-medium transition-colors"
                >
                  View all notifications
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  },
)
NotificationPanel.displayName = 'NotificationPanel'

export { NotificationPanel }
export type { NotificationPanelProps, NotificationItem }
