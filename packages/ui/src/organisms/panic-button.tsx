'use client'

import { forwardRef, useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../utils/cn'

interface PanicButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Called when the 3-second hold completes — triggers the panic */
  onTrigger: () => void
  /** Whether panic is currently active */
  isActive?: boolean
  /** Size variant */
  size?: 'sm' | 'md'
  /** Optional label override */
  label?: string
}

const HOLD_DURATION_MS = 3000

const PanicButton = forwardRef<HTMLDivElement, PanicButtonProps>(
  ({ className, onTrigger, isActive = false, size = 'md', label, ...props }, ref) => {
    const [isHolding, setIsHolding] = useState(false)
    const [progress, setProgress] = useState(0)
    const holdStartRef = useRef<number | null>(null)
    const rafRef = useRef<number | null>(null)
    const triggeredRef = useRef(false)

    const buttonSize = size === 'sm' ? 'h-10 w-10' : 'h-14 w-14'
    const iconSize = size === 'sm' ? 16 : 22
    const ringSize = size === 'sm' ? 48 : 64
    const strokeWidth = 3
    const radius = (ringSize - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius

    // Animate the progress ring
    const updateProgress = useCallback(() => {
      if (!holdStartRef.current) return

      const elapsed = Date.now() - holdStartRef.current
      const pct = Math.min(elapsed / HOLD_DURATION_MS, 1)
      setProgress(pct)

      if (pct >= 1 && !triggeredRef.current) {
        triggeredRef.current = true
        setIsHolding(false)
        holdStartRef.current = null

        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 200])
        }

        onTrigger()
        return
      }

      rafRef.current = requestAnimationFrame(updateProgress)
    }, [onTrigger])

    const startHold = useCallback(() => {
      if (isActive) return // Already in panic mode
      triggeredRef.current = false
      holdStartRef.current = Date.now()
      setIsHolding(true)
      setProgress(0)
      rafRef.current = requestAnimationFrame(updateProgress)
    }, [isActive, updateProgress])

    const cancelHold = useCallback(() => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      holdStartRef.current = null
      setIsHolding(false)
      setProgress(0)
    }, [])

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
        }
      }
    }, [])

    const strokeDashoffset = circumference * (1 - progress)

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex items-center justify-center', className)}
        {...props}
      >
        {/* Progress ring SVG */}
        <AnimatePresence>
          {isHolding && (
            <motion.svg
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="pointer-events-none absolute"
              width={ringSize}
              height={ringSize}
              viewBox={`0 0 ${ringSize} ${ringSize}`}
            >
              {/* Background ring */}
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-danger/20"
              />
              {/* Progress ring */}
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="text-danger"
                transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
              />
            </motion.svg>
          )}
        </AnimatePresence>

        {/* Button */}
        <motion.button
          type="button"
          className={cn(
            'focus-visible:ring-danger/50 relative z-10 flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2',
            buttonSize,
            isActive
              ? 'bg-danger text-white shadow-md'
              : 'bg-danger/10 text-danger hover:bg-danger/20',
            isHolding && 'bg-danger/30 scale-95',
          )}
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onContextMenu={(e) => e.preventDefault()}
          whileTap={{ scale: 0.92 }}
          aria-label={label ?? (isActive ? 'Panic mode active' : 'Hold for emergency')}
        >
          {/* Shield icon */}
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            {isActive ? (
              // Checkmark when active
              <polyline points="9 12 11 14 15 10" />
            ) : (
              // Exclamation when inactive
              <>
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </>
            )}
          </svg>
        </motion.button>

        {/* Hold hint label */}
        <AnimatePresence>
          {isHolding && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="text-danger absolute -bottom-6 whitespace-nowrap text-[10px] font-medium"
            >
              Hold {Math.ceil((1 - progress) * 3)}s...
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    )
  },
)
PanicButton.displayName = 'PanicButton'

export { PanicButton }
export type { PanicButtonProps }
