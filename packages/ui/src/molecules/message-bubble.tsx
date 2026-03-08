import { forwardRef } from 'react'
import { type VariantProps, cva } from 'class-variance-authority'
import { Translate } from '@phosphor-icons/react'
import { cn } from '../utils/cn'

const messageBubbleVariants = cva('max-w-[75%] rounded-2xl px-4 py-2.5 text-sm', {
  variants: {
    variant: {
      sent: 'bg-[image:var(--gradient-cta)] text-white ml-auto rounded-br-md',
      received: 'bg-surface-elevated text-text-primary border border-border-subtle rounded-bl-md',
      gift: 'border border-secondary/30 bg-secondary/5 text-text-primary rounded-xl backdrop-blur-sm',
    },
  },
  defaultVariants: {
    variant: 'received',
  },
})

interface MessageBubbleProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof messageBubbleVariants> {
  message: string
  timestamp?: string
  translated?: boolean
  senderName?: string
}

const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(
  ({ className, variant, message, timestamp, translated, senderName, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-0.5',
          variant === 'sent' ? 'items-end' : 'items-start',
          className,
        )}
        {...props}
      >
        {senderName && variant === 'received' ? (
          <span className="text-text-muted ml-1 text-xs font-medium">{senderName}</span>
        ) : null}
        <div className={messageBubbleVariants({ variant })}>
          <p className="whitespace-pre-wrap break-words">{message}</p>
        </div>
        <div className="flex items-center gap-1 px-1">
          {translated ? <Translate size={10} className="text-text-muted" /> : null}
          {timestamp ? <span className="text-text-muted text-[10px]">{timestamp}</span> : null}
        </div>
      </div>
    )
  },
)
MessageBubble.displayName = 'MessageBubble'

export { MessageBubble, messageBubbleVariants }
export type { MessageBubbleProps }
