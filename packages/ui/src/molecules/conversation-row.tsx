import { forwardRef } from 'react'
import { cn } from '../utils/cn'
import { Avatar } from '../atoms/avatar'

interface ConversationRowProps extends React.HTMLAttributes<HTMLButtonElement> {
  name: string
  avatar?: string
  lastMessage: string
  timestamp: string
  unreadCount?: number
  online?: boolean
  verified?: boolean
}

const ConversationRow = forwardRef<HTMLButtonElement, ConversationRowProps>(
  (
    {
      className,
      name,
      avatar,
      lastMessage,
      timestamp,
      unreadCount = 0,
      online,
      verified,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'hover:bg-surface flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors',
          unreadCount > 0 && 'bg-surface',
          className,
        )}
        {...props}
      >
        <Avatar src={avatar} fallback={name} size="lg" online={online} verified={verified} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-text-primary truncate text-sm font-semibold">{name}</h4>
            <span className="text-text-muted shrink-0 text-[10px]">{timestamp}</span>
          </div>
          <p
            className={cn(
              'mt-0.5 truncate text-xs',
              unreadCount > 0 ? 'text-text-primary font-medium' : 'text-text-muted',
            )}
          >
            {lastMessage}
          </p>
        </div>
        {unreadCount > 0 ? (
          <span className="bg-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>
    )
  },
)
ConversationRow.displayName = 'ConversationRow'

export { ConversationRow }
export type { ConversationRowProps }
