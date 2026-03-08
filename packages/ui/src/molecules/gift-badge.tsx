import { forwardRef } from 'react'
import { Gift } from '@phosphor-icons/react'
import { cn } from '../utils/cn'

interface GiftBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  giftName: string
  senderName: string
  tokenValue: number
}

const GiftBadge = forwardRef<HTMLDivElement, GiftBadgeProps>(
  ({ className, giftName, senderName, tokenValue, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'border-secondary/20 bg-secondary/5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-sm',
          className,
        )}
        {...props}
      >
        <Gift size={16} weight="fill" className="text-secondary" />
        <div className="text-xs">
          <span className="text-text-primary font-semibold">{senderName}</span>
          <span className="text-text-muted"> sent </span>
          <span className="text-secondary font-semibold">{giftName}</span>
          <span className="text-text-muted ml-1">({tokenValue}t)</span>
        </div>
      </div>
    )
  },
)
GiftBadge.displayName = 'GiftBadge'

export { GiftBadge }
export type { GiftBadgeProps }
