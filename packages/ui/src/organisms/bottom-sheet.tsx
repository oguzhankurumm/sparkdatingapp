'use client'

import { forwardRef, useEffect } from 'react'
import { cn } from '../utils/cn'

interface BottomSheetProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean
  onClose: () => void
  /** Sheet title shown above content, optional */
  title?: string
  /** Max height as a Tailwind class, e.g. 'max-h-[80vh]'. Defaults to 80vh */
  maxHeight?: string
}

const BottomSheet = forwardRef<HTMLDivElement, BottomSheetProps>(
  ({ className, open, onClose, title, maxHeight = 'max-h-[80vh]', children, ...props }, ref) => {
    // Lock body scroll when open
    useEffect(() => {
      if (open) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
      return () => {
        document.body.style.overflow = ''
      }
    }, [open])

    // Close on Escape
    useEffect(() => {
      if (!open) return
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      document.addEventListener('keydown', handler)
      return () => document.removeEventListener('keydown', handler)
    }, [open, onClose])

    if (!open) return null

    return (
      <div className="z-sheet fixed inset-0 flex flex-col justify-end">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Sheet panel — slide-up via CSS animation using sheet variants from animations.ts */}
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label={title ?? 'Bottom sheet'}
          className={cn(
            // Spec: rounded-[32px_32px_0_0], bg-surface-elevated, overflow-hidden
            'bg-surface-elevated relative flex flex-col overflow-hidden',
            'rounded-[32px_32px_0_0]',
            // Slide-up animation via CSS
            'animate-sheet-up',
            maxHeight,
            className,
          )}
          {...props}
        >
          {/* Handle pill — spec: 4×32px, bg-border, centered, mt-3 */}
          <div className="flex shrink-0 justify-center pb-1 pt-3">
            <div className="bg-border h-1 w-8 rounded-full" />
          </div>

          {/* Optional title */}
          {title ? (
            <div className="shrink-0 px-5 pb-2">
              <h2 className="text-text-primary text-[18px] font-semibold leading-snug tracking-[-0.025em]">
                {title}
              </h2>
            </div>
          ) : null}

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-[env(safe-area-inset-bottom)]">
            {children}
          </div>
        </div>
      </div>
    )
  },
)
BottomSheet.displayName = 'BottomSheet'

export { BottomSheet }
export type { BottomSheetProps }
