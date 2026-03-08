'use client'

import { forwardRef } from 'react'
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '../utils/cn'

const badgeVariants = cva('inline-flex items-center gap-1 font-semibold transition-colors', {
  variants: {
    variant: {
      default: 'bg-surface-elevated text-text-secondary border border-border',
      plan: 'text-white',
      match: 'bg-[image:var(--gradient-brand)] text-white',
      verified: 'bg-super-like/10 text-super-like',
      online: 'bg-success/10 text-success',
      boost: 'bg-boost/10 text-boost',
      new: 'bg-like/10 text-like',
    },
    size: {
      sm: 'h-5 px-2 text-[10px] rounded-md',
      md: 'h-6 px-2.5 text-xs rounded-lg',
      lg: 'h-7 px-3 text-sm rounded-lg',
    },
    plan: {
      free: '',
      premium: 'bg-[image:var(--gradient-premium)]',
      platinum: 'bg-[image:var(--gradient-platinum)]',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
  compoundVariants: [{ variant: 'plan', plan: 'free', class: 'bg-pass/10 text-pass' }],
})

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, plan, children, ...props }, ref) => {
    return (
      <span ref={ref} className={cn(badgeVariants({ variant, size, plan }), className)} {...props}>
        {children}
      </span>
    )
  },
)
Badge.displayName = 'Badge'

export { Badge, badgeVariants }
export type { BadgeProps }
