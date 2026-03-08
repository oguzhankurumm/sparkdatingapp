import { forwardRef } from 'react'
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '../utils/cn'

const typographyVariants = cva('', {
  variants: {
    variant: {
      display: 'text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl',
      h1: 'text-3xl font-bold tracking-tight sm:text-4xl',
      h2: 'text-2xl font-bold tracking-tight',
      h3: 'text-xl font-semibold',
      'body-lg': 'text-lg',
      body: 'text-base',
      label: 'text-sm font-medium',
      caption: 'text-xs text-text-secondary',
      micro: 'text-[10px] text-text-muted',
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
