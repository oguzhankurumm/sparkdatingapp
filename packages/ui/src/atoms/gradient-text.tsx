import { forwardRef } from 'react'
import { cn } from '../utils/cn'

interface GradientTextProps extends React.HTMLAttributes<HTMLElement> {
  gradient?: 'brand' | 'cta' | 'like' | 'premium' | 'platinum'
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p'
}

const gradientMap = {
  brand: 'bg-[image:var(--gradient-brand)]',
  cta: 'bg-[image:var(--gradient-cta)]',
  like: 'bg-[image:var(--gradient-like)]',
  premium: 'bg-[image:var(--gradient-premium)]',
  platinum: 'bg-[image:var(--gradient-platinum)]',
} as const

const GradientText = forwardRef<HTMLElement, GradientTextProps>(
  ({ className, gradient = 'brand', as: Component = 'span', children, ...props }, ref) => {
    return (
      <Component
        ref={ref as React.Ref<never>}
        className={cn('bg-clip-text text-transparent', gradientMap[gradient], className)}
        {...props}
      >
        {children}
      </Component>
    )
  },
)
GradientText.displayName = 'GradientText'

export { GradientText }
export type { GradientTextProps }
