'use client'

import { forwardRef } from 'react'
import { ArrowLeft, DotsThree, Phone } from '@phosphor-icons/react'
import { cn } from '../utils/cn'
import { Avatar } from '../atoms/avatar'
import { ChatInput } from '../organisms/chat-input'

interface ChatLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  recipientName: string
  recipientAvatar?: string
  recipientOnline?: boolean
  recipientVerified?: boolean
  onBack?: () => void
  onCall?: () => void
  onMore?: () => void
  onSend?: (message: string) => void
  onImageClick?: () => void
  onVoiceClick?: () => void
  onGiftClick?: () => void
  onHelperClick?: () => void
  showHelper?: boolean
}

const ChatLayout = forwardRef<HTMLDivElement, ChatLayoutProps>(
  (
    {
      className,
      recipientName,
      recipientAvatar,
      recipientOnline,
      recipientVerified,
      onBack,
      onCall,
      onMore,
      onSend,
      onImageClick,
      onVoiceClick,
      onGiftClick,
      onHelperClick,
      showHelper,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div ref={ref} className={cn('bg-background flex h-screen flex-col', className)} {...props}>
        {/* Sticky header */}
        <header className="z-sticky border-border-subtle sticky top-0 flex items-center gap-3 border-b bg-[var(--surface-glass)] px-4 py-3 backdrop-blur-xl">
          <button
            type="button"
            onClick={onBack}
            className="text-text-secondary hover:bg-surface rounded-full p-1"
          >
            <ArrowLeft size={22} />
          </button>

          <Avatar
            src={recipientAvatar}
            fallback={recipientName}
            size="sm"
            online={recipientOnline}
            verified={recipientVerified}
          />

          <div className="min-w-0 flex-1">
            <h2 className="text-text-primary truncate text-sm font-semibold">{recipientName}</h2>
            {recipientOnline ? <p className="text-success text-xs">Online</p> : null}
          </div>

          <div className="flex gap-1">
            <button
              type="button"
              onClick={onCall}
              className="text-text-secondary hover:bg-surface rounded-full p-2"
            >
              <Phone size={20} />
            </button>
            <button
              type="button"
              onClick={onMore}
              className="text-text-secondary hover:bg-surface rounded-full p-2"
            >
              <DotsThree size={20} weight="bold" />
            </button>
          </div>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>

        {/* Sticky input */}
        <ChatInput
          onSend={onSend}
          onImageClick={onImageClick}
          onVoiceClick={onVoiceClick}
          onGiftClick={onGiftClick}
          onHelperClick={onHelperClick}
          showHelper={showHelper}
        />
      </div>
    )
  },
)
ChatLayout.displayName = 'ChatLayout'

export { ChatLayout }
export type { ChatLayoutProps }
