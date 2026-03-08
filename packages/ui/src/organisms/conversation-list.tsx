import { forwardRef } from 'react'
import { cn } from '../utils/cn'
import { ConversationRow } from '../molecules/conversation-row'

interface ConversationItem {
  id: string
  name: string
  avatar?: string
  lastMessage: string
  timestamp: string
  unreadCount?: number
  online?: boolean
  verified?: boolean
}

interface ConversationListProps extends React.HTMLAttributes<HTMLDivElement> {
  conversations: ConversationItem[]
  onConversationClick?: (id: string) => void
}

const ConversationList = forwardRef<HTMLDivElement, ConversationListProps>(
  ({ className, conversations, onConversationClick, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex flex-col', className)} {...props}>
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-text-primary text-lg font-semibold">No conversations yet</p>
            <p className="text-text-muted mt-1 text-sm">Match with someone to start chatting</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <ConversationRow
              key={conversation.id}
              name={conversation.name}
              avatar={conversation.avatar}
              lastMessage={conversation.lastMessage}
              timestamp={conversation.timestamp}
              unreadCount={conversation.unreadCount}
              online={conversation.online}
              verified={conversation.verified}
              onClick={() => onConversationClick?.(conversation.id)}
            />
          ))
        )}
      </div>
    )
  },
)
ConversationList.displayName = 'ConversationList'

export { ConversationList }
export type { ConversationListProps, ConversationItem }
