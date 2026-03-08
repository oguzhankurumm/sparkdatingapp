import { forwardRef } from 'react'
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '../utils/cn'

const skeletonVariants = cva('animate-pulse bg-border/50', {
  variants: {
    variant: {
      text: 'h-4 rounded-md',
      card: 'aspect-[3/4] rounded-2xl',
      avatar: 'rounded-full',
      line: 'h-3 rounded-full',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  defaultVariants: {
    variant: 'text',
  },
  compoundVariants: [
    { variant: 'avatar', size: 'sm', class: 'h-8 w-8' },
    { variant: 'avatar', size: 'md', class: 'h-10 w-10' },
    { variant: 'avatar', size: 'lg', class: 'h-16 w-16' },
  ],
})

interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof skeletonVariants> {}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(skeletonVariants({ variant, size }), className)} {...props} />
    )
  },
)
Skeleton.displayName = 'Skeleton'

export { Skeleton, skeletonVariants }
export type { SkeletonProps }
