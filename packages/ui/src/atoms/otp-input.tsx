'use client'

import { forwardRef, useRef } from 'react'
import { cn } from '../utils/cn'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  error?: boolean
  className?: string
}

const OtpInput = forwardRef<HTMLDivElement, OtpInputProps>(
  ({ value, onChange, length = 6, disabled, error, className }, ref) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    const digits = Array.from({ length }, (_, i) => value[i] ?? '')

    const handleChange = (index: number, char: string) => {
      const digit = char.replace(/\D/g, '').slice(-1)
      const next = digits.map((d, i) => (i === index ? digit : d)).join('')
      onChange(next)
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        if (!digits[index] && index > 0) {
          const next = digits.map((d, i) => (i === index - 1 ? '' : d)).join('')
          onChange(next)
          inputRefs.current[index - 1]?.focus()
        } else {
          const next = digits.map((d, i) => (i === index ? '' : d)).join('')
          onChange(next)
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus()
      } else if (e.key === 'ArrowRight' && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault()
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
      onChange(pasted.padEnd(length, '').slice(0, length))
      const nextFocus = Math.min(pasted.length, length - 1)
      inputRefs.current[nextFocus]?.focus()
    }

    return (
      <div ref={ref} className={cn('flex gap-2', className)}>
        {digits.map((digit, index) => (
          <input
            // key={index} is safe here — OTP cells are static-length and never reordered
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={cn(
              // Spec: 52×60px cells, radius-md (14px), border, center text
              'h-[60px] w-[52px] rounded-[14px] border text-center text-xl font-bold',
              'border-border bg-surface-elevated text-text-primary',
              'transition-all duration-150',
              'focus:border-primary focus:ring-primary/20 focus:outline-none focus:ring-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-error focus:border-error focus:ring-error/20',
              digit && !error && 'border-primary/50 bg-primary/5',
            )}
          />
        ))}
      </div>
    )
  },
)
OtpInput.displayName = 'OtpInput'

export { OtpInput }
export type { OtpInputProps }
