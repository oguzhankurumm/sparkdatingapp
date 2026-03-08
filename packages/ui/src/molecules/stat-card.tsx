import { forwardRef } from 'react'
import { cn } from '../utils/cn'

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: 'up' | 'down' | null
}

const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, label, value, icon, trend, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'border-border bg-surface-elevated flex items-center gap-3 rounded-xl border p-4',
          className,
        )}
        {...props}
      >
        {icon ? (
          <div className="bg-primary-light text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <p className="text-text-muted text-xs">{label}</p>
          <p className="text-text-primary text-lg font-bold">
            {value}
            {trend === 'up' ? <span className="text-success ml-1 text-xs">↑</span> : null}
            {trend === 'down' ? <span className="text-danger ml-1 text-xs">↓</span> : null}
          </p>
        </div>
      </div>
    )
  },
)
StatCard.displayName = 'StatCard'

export { StatCard }
export type { StatCardProps }
