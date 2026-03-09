import { forwardRef } from 'react'
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '../utils/cn'

const pillTagVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-surface-elevated text-text-secondary border border-border-subtle',
        interest: 'bg-primary-light text-primary',
        zodiac: 'bg-secondary/10 text-secondary',
        'zodiac-high': 'bg-like/10 text-like',
        'zodiac-medium': 'bg-secondary/10 text-secondary',
        'zodiac-low': 'bg-text-muted/10 text-text-muted',
        'looking-for': 'bg-like/10 text-like',
        selected: 'bg-primary text-text-inverse',
      },
      size: {
        sm: 'h-6 px-2.5 text-xs',
        md: 'h-7 px-3 text-sm',
        lg: 'h-8 px-4 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

interface PillTagProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof pillTagVariants> {
  icon?: React.ReactNode
  removable?: boolean
  onRemove?: () => void
}

const PillTag = forwardRef<HTMLSpanElement, PillTagProps>(
  ({ className, variant, size, icon, removable, onRemove, children, ...props }, ref) => {
    return (
      <span ref={ref} className={cn(pillTagVariants({ variant, size }), className)} {...props}>
        {icon}
        {children}
        {removable ? (
          <button
            type="button"
            onClick={onRemove}
            className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10"
            aria-label="Remove"
          >
            ×
          </button>
        ) : null}
      </span>
    )
  },
)
PillTag.displayName = 'PillTag'

export { PillTag, pillTagVariants }
export type { PillTagProps }
