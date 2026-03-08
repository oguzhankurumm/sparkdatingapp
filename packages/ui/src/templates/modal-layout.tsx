'use client'

import { forwardRef, useEffect } from 'react'
import { X } from '@phosphor-icons/react'
import { cn } from '../utils/cn'

interface ModalLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'full'
  showClose?: boolean
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  full: 'max-w-full mx-4',
} as const

const ModalLayout = forwardRef<HTMLDivElement, ModalLayoutProps>(
  ({ className, open, onClose, title, size = 'md', showClose = true, children, ...props }, ref) => {
    // Lock body scroll when open
    useEffect(() => {
      if (open) {
        document.body.style.overflow = 'hidden'
        return () => {
          document.body.style.overflow = ''
        }
      }
    }, [open])

    if (!open) return null

    return (
      <div
        ref={ref}
        className={cn('z-modal fixed inset-0 flex items-center justify-center p-4', className)}
        {...props}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          role="button"
          tabIndex={-1}
          aria-label="Close modal"
        />

        {/* Content */}
        <div
          className={cn(
            'bg-surface-elevated relative z-10 w-full rounded-3xl shadow-lg',
            sizeClasses[size],
          )}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {/* Header */}
          {title || showClose ? (
            <div className="border-border-subtle flex items-center justify-between border-b px-6 py-4">
              {title ? <h2 className="text-text-primary text-lg font-bold">{title}</h2> : <div />}
              {showClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-text-muted hover:bg-surface hover:text-text-secondary rounded-full p-1 transition-colors"
                >
                  <X size={20} />
                </button>
              ) : null}
            </div>
          ) : null}

          {/* Body */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    )
  },
)
ModalLayout.displayName = 'ModalLayout'

export { ModalLayout }
export type { ModalLayoutProps }
