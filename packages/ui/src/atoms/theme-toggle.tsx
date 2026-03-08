'use client'

import { forwardRef } from 'react'
import { Sun, Moon } from '@phosphor-icons/react'
import { cn } from '../utils/cn'

type Theme = 'light' | 'dark'

interface ThemeToggleProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  theme?: Theme
  onChange?: (theme: Theme) => void
}

const ThemeToggle = forwardRef<HTMLButtonElement, ThemeToggleProps>(
  ({ className, theme = 'light', onChange, ...props }, ref) => {
    const isDark = theme === 'dark'

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={() => onChange?.(isDark ? 'light' : 'dark')}
        className={cn(
          'focus-visible:ring-primary/50 relative inline-flex h-8 w-16 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          isDark ? 'bg-surface-elevated' : 'bg-amber-100',
          className,
        )}
        {...props}
      >
        {/* Track icons */}
        <Sun
          size={14}
          weight="fill"
          className={cn(
            'absolute left-1.5 text-amber-500 transition-opacity duration-300',
            isDark ? 'opacity-40' : 'opacity-0',
          )}
        />
        <Moon
          size={14}
          weight="fill"
          className={cn(
            'absolute right-1.5 text-indigo-300 transition-opacity duration-300',
            isDark ? 'opacity-0' : 'opacity-40',
          )}
        />

        {/* Thumb */}
        <span
          className={cn(
            'pointer-events-none flex h-6 w-6 items-center justify-center rounded-full shadow-sm ring-0 transition-all duration-300',
            isDark ? 'translate-x-8 bg-indigo-900' : 'translate-x-0.5 bg-white',
          )}
        >
          {isDark ? (
            <Moon size={14} weight="fill" className="text-indigo-300" />
          ) : (
            <Sun size={14} weight="fill" className="text-amber-500" />
          )}
        </span>
      </button>
    )
  },
)
ThemeToggle.displayName = 'ThemeToggle'

export { ThemeToggle }
export type { ThemeToggleProps }
