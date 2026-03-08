import { forwardRef } from 'react'
import { cn } from '../utils/cn'

interface MatchPercentBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  percent: number
}

const MatchPercentBadge = forwardRef<HTMLSpanElement, MatchPercentBadgeProps>(
  ({ className, percent, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-[image:var(--gradient-brand)] px-3 py-1 text-xs font-bold text-white shadow-sm',
          className,
        )}
        {...props}
      >
        {percent}% Match
      </span>
    )
  },
)
MatchPercentBadge.displayName = 'MatchPercentBadge'

export { MatchPercentBadge }
export type { MatchPercentBadgeProps }
