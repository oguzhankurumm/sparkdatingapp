'use client'

import { forwardRef, useState } from 'react'
import { type VariantProps, cva } from 'class-variance-authority'
import { Eye, EyeSlash, MagnifyingGlass } from '@phosphor-icons/react'
import { cn } from '../utils/cn'

const inputVariants = cva(
  'w-full bg-surface-elevated text-text-primary placeholder:text-text-muted border border-border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'rounded-xl px-4',
        search: 'rounded-full pl-10 pr-4',
        otp: 'rounded-lg text-center text-2xl font-bold tracking-widest',
      },
      inputSize: {
        sm: 'h-9 text-sm',
        md: 'h-11 text-sm',
        lg: 'h-12 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
    },
  },
)

interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  error?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, inputSize, type, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const isSearch = variant === 'search'

    return (
      <div className="relative">
        {isSearch ? (
          <MagnifyingGlass
            className="text-text-muted absolute left-3 top-1/2 -translate-y-1/2"
            size={18}
            weight="bold"
          />
        ) : null}
        <input
          ref={ref}
          type={isPassword && showPassword ? 'text' : type}
          className={cn(
            inputVariants({ variant, inputSize }),
            error && 'border-danger focus:ring-danger/30',
            isPassword && 'pr-10',
            className,
          )}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="text-text-muted hover:text-text-secondary absolute right-3 top-1/2 -translate-y-1/2"
            tabIndex={-1}
          >
            {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
          </button>
        ) : null}
      </div>
    )
  },
)
Input.displayName = 'Input'

export { Input, inputVariants }
export type { InputProps }
