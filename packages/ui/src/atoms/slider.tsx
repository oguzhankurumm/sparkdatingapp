'use client'

import { forwardRef } from 'react'
import { cn } from '../utils/cn'

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: number
  onChange?: (value: number) => void
  label?: string
  showValue?: boolean
  formatValue?: (value: number) => string
}

const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      value = 50,
      min = 0,
      max = 100,
      onChange,
      label,
      showValue,
      formatValue,
      ...props
    },
    ref,
  ) => {
    const percent = ((Number(value) - Number(min)) / (Number(max) - Number(min))) * 100

    return (
      <div className={cn('w-full', className)}>
        {label || showValue ? (
          <div className="mb-2 flex items-center justify-between">
            {label ? (
              <span className="text-text-secondary text-sm font-medium">{label}</span>
            ) : null}
            {showValue ? (
              <span className="text-primary text-sm font-semibold">
                {formatValue ? formatValue(Number(value)) : value}
              </span>
            ) : null}
          </div>
        ) : null}
        <div className="bg-border relative h-2 w-full rounded-full">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[image:var(--gradient-brand)]"
            style={{ width: `${percent}%` }}
          />
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange?.(Number(e.target.value))}
            className="[&::-webkit-slider-thumb]:border-primary absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
            {...props}
          />
        </div>
      </div>
    )
  },
)
Slider.displayName = 'Slider'

export { Slider }
export type { SliderProps }
