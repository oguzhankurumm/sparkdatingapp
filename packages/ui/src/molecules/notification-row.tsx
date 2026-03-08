'use client'

import { forwardRef } from 'react'
import {
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
  Bell,
} from '@phosphor-icons/react'
import { cn } from '../utils/cn'
import { Avatar } from '../atoms/avatar'

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

interface NotificationRowProps extends React.HTMLAttributes<HTMLButtonElement> {
  type: string
  title: string
  body?: string | null
  timestamp: string
  read: boolean
  actor?: {
    id: string
    firstName: string
    avatarUrl: string | null
  } | null
}

const NotificationRow = forwardRef<HTMLButtonElement, NotificationRowProps>(
  ({ className, type, title, body, timestamp, read, actor, ...props }, ref) => {
    const iconConfig = notificationIcons[type] ?? notificationIcons.system!
    const Icon = iconConfig.icon

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors',
          read ? 'hover:bg-surface' : 'bg-primary-light/50 hover:bg-primary-light',
          className,
        )}
        {...props}
      >
        {/* Avatar or icon */}
        <div className="relative shrink-0">
          {actor ? (
            <Avatar src={actor.avatarUrl} fallback={actor.firstName} size="md" />
          ) : (
            <div className="bg-surface flex h-10 w-10 items-center justify-center rounded-full">
              <Icon size={20} weight="fill" className={iconConfig.color} />
            </div>
          )}

          {/* Type badge overlay (shown when actor is present) */}
          {actor ? (
            <div
              className={cn(
                'absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white dark:border-[var(--surface)]',
                'bg-surface-elevated',
              )}
            >
              <Icon size={10} weight="fill" className={iconConfig.color} />
            </div>
          ) : null}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                'text-sm leading-snug',
                read ? 'text-text-secondary' : 'text-text-primary font-medium',
              )}
            >
              {title}
            </p>
            <span className="text-text-muted mt-0.5 shrink-0 text-[10px]">{timestamp}</span>
          </div>
          {body ? <p className="text-text-muted mt-0.5 truncate text-xs">{body}</p> : null}
        </div>

        {/* Unread dot */}
        {!read ? <div className="bg-primary mt-2 h-2 w-2 shrink-0 rounded-full" /> : null}
      </button>
    )
  },
)
NotificationRow.displayName = 'NotificationRow'

export { NotificationRow }
export type { NotificationRowProps }
