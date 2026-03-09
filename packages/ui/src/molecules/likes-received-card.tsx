import { forwardRef } from 'react'
import { cn } from '../utils/cn'

interface LikesReceivedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Photo URL */
  photo: string
  /** First name */
  name: string
  /** Age */
  age: number
  /** Whether photos are blurred (free tier) */
  blurred?: boolean
  /** Time since they liked you — e.g. "2h ago" */
  timeAgo?: string
  /** Callback when tapped on a blurred card — upsell */
  onUnlock?: () => void
}

const LikesReceivedCard = forwardRef<HTMLDivElement, LikesReceivedCardProps>(
  ({ className, photo, name, age, blurred = false, timeAgo, onUnlock, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-surface relative w-36 flex-shrink-0 overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/[0.04]',
          className,
        )}
        {...props}
      >
        {/* Photo area — 3:4 ratio */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={photo}
            alt={blurred ? 'Someone likes you' : `${name}, ${age}`}
            className={cn(
              'h-full w-full object-cover transition-[filter] duration-300',
              blurred && 'scale-110 blur-[18px]',
            )}
            draggable={false}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Blur unlock overlay */}
          {blurred && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[var(--primary)]"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              {onUnlock && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onUnlock()
                  }}
                  className="mt-2 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] px-3 py-1 text-[10px] font-semibold text-white shadow-md transition-transform active:scale-95"
                >
                  See Who
                </button>
              )}
            </div>
          )}

          {/* Name + age bottom-left */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <p className="text-sm font-semibold text-white drop-shadow-sm">
              {blurred ? '???' : `${name}, ${age}`}
            </p>
            {timeAgo && <p className="text-[10px] text-white/70">{timeAgo}</p>}
          </div>
        </div>

        {/* "Liked You" badge */}
        <div className="flex items-center justify-center gap-1 py-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="var(--like)"
            className="text-[var(--like)]"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span className="text-text-secondary text-xs font-medium">Liked You</span>
        </div>
      </div>
    )
  },
)
LikesReceivedCard.displayName = 'LikesReceivedCard'

export { LikesReceivedCard }
export type { LikesReceivedCardProps }
