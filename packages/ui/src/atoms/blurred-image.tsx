import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const blurredImageVariants = cva('relative overflow-hidden', {
  variants: {
    blur: {
      none: '',
      light: '[&>img]:blur-[8px]',
      medium: '[&>img]:blur-[16px]',
      heavy: '[&>img]:blur-[24px]',
    },
    rounded: {
      none: '',
      md: 'rounded-xl',
      lg: 'rounded-2xl',
      full: 'rounded-full',
    },
  },
  defaultVariants: {
    blur: 'medium',
    rounded: 'lg',
  },
})

interface BlurredImageProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof blurredImageVariants> {
  src: string
  alt: string
  /** Show blur overlay with optional unlock CTA */
  blurred?: boolean
  /** Text shown on the blur overlay */
  overlayText?: string
  /** Icon element to render in the overlay */
  overlayIcon?: React.ReactNode
  /** Callback when unlock CTA is clicked */
  onUnlock?: () => void
}

const BlurredImage = forwardRef<HTMLDivElement, BlurredImageProps>(
  (
    {
      className,
      src,
      alt,
      blurred = false,
      blur,
      rounded,
      overlayText,
      overlayIcon,
      onUnlock,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          blurredImageVariants({
            blur: blurred ? blur : 'none',
            rounded,
          }),
          className,
        )}
        {...props}
      >
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover transition-[filter] duration-300"
          draggable={false}
        />

        {/* Blur overlay with CTA */}
        {blurred && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Semi-transparent scrim for readability */}
            <div className="absolute inset-0 bg-black/10" />

            {/* Unlock content */}
            <div className="relative z-10 flex flex-col items-center gap-2 text-center">
              {overlayIcon && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md">
                  {overlayIcon}
                </div>
              )}
              {overlayText && (
                <p className="text-xs font-semibold text-white drop-shadow-md">{overlayText}</p>
              )}
              {onUnlock && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onUnlock()
                  }}
                  className="mt-1 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] px-4 py-1.5 text-xs font-semibold text-white shadow-md transition-transform active:scale-95"
                >
                  Upgrade to See
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  },
)
BlurredImage.displayName = 'BlurredImage'

export { BlurredImage, blurredImageVariants }
export type { BlurredImageProps }
