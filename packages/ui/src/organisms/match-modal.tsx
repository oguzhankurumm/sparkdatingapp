'use client'

import { forwardRef } from 'react'
import { ChatCircle, X } from '@phosphor-icons/react'
import { cn } from '../utils/cn'
import { Avatar } from '../atoms/avatar'
import { Button } from '../atoms/button'
import { GradientText } from '../atoms/gradient-text'

interface MatchModalProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean
  onClose: () => void
  onSendMessage: () => void
  onKeepSwiping: () => void
  user1: { name: string; avatar?: string }
  user2: { name: string; avatar?: string }
  matchPercent?: number
}

const MatchModal = forwardRef<HTMLDivElement, MatchModalProps>(
  (
    {
      className,
      open,
      onClose,
      onSendMessage,
      onKeepSwiping,
      user1,
      user2,
      matchPercent,
      ...props
    },
    ref,
  ) => {
    if (!open) return null

    return (
      <div
        ref={ref}
        className={cn('z-modal fixed inset-0 flex items-center justify-center p-4', className)}
        {...props}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          role="button"
          tabIndex={-1}
          aria-label="Close"
        />

        {/* Content */}
        <div className="bg-surface-elevated relative z-10 w-full max-w-sm rounded-3xl p-8 text-center shadow-lg">
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:bg-surface absolute right-4 top-4 rounded-full p-1"
          >
            <X size={20} />
          </button>

          <GradientText as="h2" gradient="brand" className="text-3xl font-extrabold">
            It&apos;s a Match!
          </GradientText>

          {matchPercent ? (
            <p className="text-text-secondary mt-1 text-sm">{matchPercent}% compatibility</p>
          ) : null}

          {/* Avatars */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <Avatar src={user1.avatar} fallback={user1.name} size="2xl" ring="story" />
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[image:var(--gradient-like)] text-lg text-white">
              ♥
            </div>
            <Avatar src={user2.avatar} fallback={user2.name} size="2xl" ring="story" />
          </div>

          <p className="text-text-secondary mt-4 text-sm">
            You and <span className="text-text-primary font-semibold">{user2.name}</span> liked each
            other
          </p>

          {/* Actions */}
          <div className="mt-6 space-y-3">
            <Button
              variant="primary"
              size="lg"
              rounded="full"
              className="w-full"
              onClick={onSendMessage}
            >
              <ChatCircle size={18} weight="fill" />
              Send a Message
            </Button>
            <Button
              variant="ghost"
              size="lg"
              rounded="full"
              className="w-full"
              onClick={onKeepSwiping}
            >
              Keep Swiping
            </Button>
          </div>
        </div>
      </div>
    )
  },
)
MatchModal.displayName = 'MatchModal'

export { MatchModal }
export type { MatchModalProps }
