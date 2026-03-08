import { forwardRef } from 'react'
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '../utils/cn'

const typographyVariants = cva('', {
  variants: {
    variant: {
      // Spec: 36px/800, -0.025em tracking
      display: 'text-[36px] font-extrabold leading-tight tracking-[-0.025em]',
      // Spec: 28px/700, -0.025em tracking
      h1: 'text-[28px] font-bold leading-tight tracking-[-0.025em]',
      // Spec: 22px/700, -0.025em tracking
      h2: 'text-[22px] font-bold leading-snug tracking-[-0.025em]',
      // Spec: 18px/600, -0.025em tracking
      h3: 'text-[18px] font-semibold leading-snug tracking-[-0.025em]',
      // Spec: 16px/400
      'body-lg': 'text-[16px] font-normal leading-relaxed',
      // Spec: 15px/400
      body: 'text-[15px] font-normal leading-relaxed',
      // Spec: 14px/500, 0.01em tracking
      label: 'text-[14px] font-medium leading-none tracking-[0.01em]',
      // Spec: 12px/400, 0.01em tracking
      caption: 'text-[12px] font-normal leading-normal tracking-[0.01em] text-text-secondary',
      // Spec: 11px/500, 0.01em tracking
      micro: 'text-[11px] font-medium leading-none tracking-[0.01em] text-text-muted',
    },
  },
  defaultVariants: {
    variant: 'body',
  },
})

type TypographyElement = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'label'

const variantToElement: Record<string, TypographyElement> = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  'body-lg': 'p',
  body: 'p',
  label: 'label',
  caption: 'span',
  micro: 'span',
}

interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof typographyVariants> {
  as?: TypographyElement
}

const Typography = forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, as, children, ...props }, ref) => {
    const Component = as ?? variantToElement[variant ?? 'body'] ?? 'p'

    return (
      // @ts-expect-error -- dynamic element type is intentional
      <Component ref={ref} className={cn(typographyVariants({ variant }), className)} {...props}>
        {children}
      </Component>
    )
  },
)
Typography.displayName = 'Typography'

export { Typography, typographyVariants }
export type { TypographyProps }
