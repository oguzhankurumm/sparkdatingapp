'use client'

import { forwardRef } from 'react'
import { type VariantProps, cva } from 'class-variance-authority'
import { SealCheck } from '@phosphor-icons/react'
import { cn } from '../utils/cn'

const avatarVariants = cva('relative inline-flex shrink-0 overflow-hidden rounded-full', {
  variants: {
    size: {
      xs: 'h-6 w-6',
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
      xl: 'h-16 w-16',
      '2xl': 'h-24 w-24',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof avatarVariants> {
  src?: string | null
  alt?: string
  fallback?: string
  ring?: 'none' | 'story' | 'live'
  verified?: boolean
  online?: boolean
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, alt, fallback, ring = 'none', verified, online, ...props }, ref) => {
    const initials = fallback
      ? fallback
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : '?'

    return (
      <div ref={ref} className={cn('relative inline-flex', className)} {...props}>
        {/* Gradient ring */}
        {ring !== 'none' ? (
          <div
            className={cn(
              'absolute -inset-[3px] rounded-full',
              ring === 'story' && 'bg-[image:var(--gradient-brand)]',
              ring === 'live' && 'from-danger animate-pulse bg-gradient-to-r to-[#FF6B6B]',
            )}
          />
        ) : null}

        <div className={cn(avatarVariants({ size }), ring !== 'none' && 'ring-background ring-2')}>
          {src ? (
            <img src={src} alt={alt ?? ''} className="h-full w-full object-cover" />
          ) : (
            <div className="bg-primary-light text-primary flex h-full w-full items-center justify-center text-xs font-semibold">
              {initials}
            </div>
          )}
        </div>

        {/* Verified badge */}
        {verified ? (
          <div className="bg-background absolute -bottom-0.5 -right-0.5 rounded-full p-0.5">
            <SealCheck
              size={size === 'xs' || size === 'sm' ? 12 : 16}
              weight="fill"
              className="text-super-like"
            />
          </div>
        ) : null}

        {/* Online indicator */}
        {online ? (
          <div
            className={cn(
              'border-background bg-success absolute bottom-0 right-0 rounded-full border-2',
              size === 'xs' || size === 'sm' ? 'h-2 w-2' : 'h-3 w-3',
            )}
          />
        ) : null}
      </div>
    )
  },
)
Avatar.displayName = 'Avatar'

export { Avatar, avatarVariants }
export type { AvatarProps }
