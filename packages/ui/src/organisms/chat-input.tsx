'use client'

import { forwardRef, useState } from 'react'
import { PaperPlaneRight, Image, Microphone, Gift, Lightbulb } from '@phosphor-icons/react'
import { cn } from '../utils/cn'

interface ChatInputProps extends React.HTMLAttributes<HTMLDivElement> {
  onSend?: (message: string) => void
  onImageClick?: () => void
  onVoiceClick?: () => void
  onGiftClick?: () => void
  onHelperClick?: () => void
  placeholder?: string
  disabled?: boolean
  showHelper?: boolean
}

const ChatInput = forwardRef<HTMLDivElement, ChatInputProps>(
  (
    {
      className,
      onSend,
      onImageClick,
      onVoiceClick,
      onGiftClick,
      onHelperClick,
      placeholder = 'Type a message...',
      disabled,
      showHelper = false,
      ...props
    },
    ref,
  ) => {
    const [message, setMessage] = useState('')

    const handleSend = () => {
      const trimmed = message.trim()
      if (!trimmed) return
      onSend?.(trimmed)
      setMessage('')
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          'border-border-subtle border-t bg-[var(--surface-glass)] px-3 py-2 backdrop-blur-xl',
          className,
        )}
        {...props}
      >
        <div className="flex items-end gap-2">
          {/* Action buttons */}
          <div className="flex shrink-0 gap-1 pb-1">
            <button
              type="button"
              onClick={onImageClick}
              className="text-text-muted hover:bg-surface hover:text-text-secondary rounded-full p-1.5 transition-colors"
              disabled={disabled}
            >
              <Image size={20} />
            </button>
            <button
              type="button"
              onClick={onGiftClick}
              className="text-text-muted hover:bg-surface hover:text-secondary rounded-full p-1.5 transition-colors"
              disabled={disabled}
            >
              <Gift size={20} />
            </button>
            {showHelper ? (
              <button
                type="button"
                onClick={onHelperClick}
                className="text-boost hover:bg-boost/10 rounded-full p-1.5 transition-colors"
                disabled={disabled}
              >
                <Lightbulb size={20} weight="fill" />
              </button>
            ) : null}
          </div>

          {/* Input */}
          <div className="min-w-0 flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="border-border bg-surface-elevated text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-primary/20 w-full resize-none rounded-2xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
            />
          </div>

          {/* Send / Voice */}
          <div className="shrink-0 pb-1">
            {message.trim() ? (
              <button
                type="button"
                onClick={handleSend}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[image:var(--gradient-cta)] text-white shadow-sm transition-transform active:scale-95"
              >
                <PaperPlaneRight size={18} weight="fill" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onVoiceClick}
                className="text-text-muted hover:bg-surface hover:text-text-secondary flex h-9 w-9 items-center justify-center rounded-full transition-colors"
                disabled={disabled}
              >
                <Microphone size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  },
)
ChatInput.displayName = 'ChatInput'

export { ChatInput }
export type { ChatInputProps }
