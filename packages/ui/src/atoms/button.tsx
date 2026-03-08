'use client'

import { forwardRef } from 'react'
import { type VariantProps, cva } from 'class-variance-authority'
import { SpinnerGap } from '@phosphor-icons/react'
import { cn } from '../utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-[#E8726C] to-[#F0A89A] text-text-inverse shadow-md hover:shadow-glow',
        secondary:
          'bg-surface-elevated text-text-primary border border-border hover:bg-primary-light',
        ghost: 'text-text-secondary hover:bg-surface hover:text-text-primary',
        danger: 'bg-danger text-white hover:bg-danger/90',
        like: 'rounded-full bg-gradient-to-r from-[#FF4F8A] to-[#FF8FA3] text-white shadow-md',
        pass: 'rounded-full bg-pass/10 text-pass border border-pass/20',
        'super-like':
          'rounded-full bg-gradient-to-r from-super-like to-[#60A5FA] text-white shadow-md',
      },
      size: {
        sm: 'h-8 px-3 text-sm gap-1.5',
        md: 'h-10 px-4 text-sm gap-2',
        lg: 'h-12 px-6 text-base gap-2',
        icon: 'h-10 w-10',
        'icon-lg': 'h-14 w-14',
        'icon-xl': 'h-16 w-16',
      },
      rounded: {
        default: 'rounded-xl',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      rounded: 'default',
    },
    compoundVariants: [
      { variant: 'like', rounded: 'default', class: 'rounded-full' },
      { variant: 'pass', rounded: 'default', class: 'rounded-full' },
      { variant: 'super-like', rounded: 'default', class: 'rounded-full' },
    ],
  },
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, rounded, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, rounded }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <SpinnerGap className="h-4 w-4 animate-spin" weight="bold" /> : null}
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
export type { ButtonProps }
