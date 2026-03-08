'use client'

import { forwardRef } from 'react'
import { cn } from '../utils/cn'

interface ToggleProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean
  onChange?: (checked: boolean) => void
  size?: 'sm' | 'md'
}

const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, checked = false, onChange, size = 'md', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        role="switch"
        type="button"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'focus-visible:ring-primary/50 relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-primary' : 'bg-border',
          size === 'sm' ? 'h-5 w-9' : 'h-6 w-11',
          className,
        )}
        {...props}
      >
        <span
          className={cn(
            'pointer-events-none inline-block transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200',
            size === 'sm' ? 'h-4 w-4' : 'h-5 w-5',
            checked ? (size === 'sm' ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0',
          )}
        />
      </button>
    )
  },
)
Toggle.displayName = 'Toggle'

export { Toggle }
export type { ToggleProps }
