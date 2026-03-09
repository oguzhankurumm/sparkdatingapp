'use client'

import { useCallback, useRef, useState } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

export const panicButtonVariants = cva(
  'relative flex items-center justify-center rounded-full font-semibold transition-all duration-200 select-none touch-none',
  {
    variants: {
      size: {
        sm: 'h-10 w-10 text-xs',
        md: 'h-14 w-14 text-sm',
        lg: 'h-20 w-20 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

export interface PanicButtonProps extends VariantProps<typeof panicButtonVariants> {
  /** Duration in ms user must hold to trigger (default: 3000) */
  holdDuration?: number
  /** Called after hold completes */
  onTrigger: () => void | Promise<void>
  /** Whether panic mode is currently active */
  isActive?: boolean
  /** Additional class names */
  className?: string
  /** Disabled state */
  disabled?: boolean
}

const HOLD_DURATION_DEFAULT = 3000

export function PanicButton({
  size,
  holdDuration = HOLD_DURATION_DEFAULT,
  onTrigger,
  isActive = false,
  className,
  disabled = false,
}: PanicButtonProps) {
  const [pressing, setPressing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [triggering, setTriggering] = useState(false)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  const cancelPress = useCallback(() => {
    setPressing(false)
    setProgress(0)
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current
    const pct = Math.min(elapsed / holdDuration, 1)
    setProgress(pct)

    if (pct >= 1) {
      setPressing(false)
      setProgress(0)
      rafRef.current = null
      setTriggering(true)
      Promise.resolve(onTrigger()).finally(() => setTriggering(false))
      return
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [holdDuration, onTrigger])

  const startPress = useCallback(() => {
    if (disabled || triggering || isActive) return
    setPressing(true)
    startTimeRef.current = Date.now()
    rafRef.current = requestAnimationFrame(tick)
  }, [disabled, triggering, isActive, tick])

  // Radial progress ring
  const radius = size === 'sm' ? 18 : size === 'lg' ? 38 : 26
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - progress)

  return (
    <button
      type="button"
      className={cn(
        panicButtonVariants({ size }),
        isActive
          ? 'bg-danger/20 text-danger border-danger/40 border-2'
          : 'bg-danger/10 text-danger hover:bg-danger/20 border-danger/20 border',
        pressing && 'scale-95',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
      disabled={disabled || triggering}
      aria-label={isActive ? 'Panic mode active' : 'Hold to activate panic mode'}
    >
      {/* Progress ring overlay */}
      {pressing && (
        <svg
          className="pointer-events-none absolute inset-0"
          viewBox={`0 0 ${(radius + 4) * 2} ${(radius + 4) * 2}`}
        >
          <circle
            cx={radius + 4}
            cy={radius + 4}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="text-danger origin-center -rotate-90 transition-none"
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          />
        </svg>
      )}

      {/* Icon */}
      {triggering ? (
        <span className="animate-spin text-sm">⏳</span>
      ) : isActive ? (
        <span className="text-xs font-bold">SOS</span>
      ) : (
        <span className="text-lg">🛡️</span>
      )}
    </button>
  )
}
