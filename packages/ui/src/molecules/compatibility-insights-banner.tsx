import { forwardRef } from 'react'
import { Sparkle } from '@phosphor-icons/react'
import { cn } from '../utils/cn'

interface CompatibilityInsightsBannerProps extends React.HTMLAttributes<HTMLButtonElement> {
  insight: string
}

const CompatibilityInsightsBanner = forwardRef<HTMLButtonElement, CompatibilityInsightsBannerProps>(
  ({ className, insight, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'border-secondary/20 bg-secondary/5 hover:bg-secondary/10 flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors',
          className,
        )}
        {...props}
      >
        <div className="bg-secondary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
          <Sparkle size={18} weight="fill" className="text-secondary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-secondary text-xs font-medium">AI Insight</p>
          <p className="text-text-primary mt-0.5 text-sm">{insight}</p>
        </div>
        <span className="text-text-muted">→</span>
      </button>
    )
  },
)
CompatibilityInsightsBanner.displayName = 'CompatibilityInsightsBanner'

export { CompatibilityInsightsBanner }
export type { CompatibilityInsightsBannerProps }
