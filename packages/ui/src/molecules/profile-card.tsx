import { forwardRef } from 'react'
import { cn } from '../utils/cn'
import { Badge } from '../atoms/badge'
import { PillTag } from '../atoms/pill-tag'

interface ProfileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  age: number
  photo: string
  matchPercent?: number
  zodiac?: string
  zodiacCompat?: number
  distance?: string
  verified?: boolean
  stamp?: 'like' | 'nope' | null
  stampOpacity?: number
  /** Blur the photo (e.g. for "Who Liked You" — free tier) */
  blurred?: boolean
  /** Callback when "Upgrade to See" is tapped on a blurred card */
  onBlurUnlock?: () => void
}

const ProfileCard = forwardRef<HTMLDivElement, ProfileCardProps>(
  (
    {
      className,
      name,
      age,
      photo,
      matchPercent,
      zodiac,
      zodiacCompat,
      distance,
      verified,
      stamp,
      stampOpacity = 0,
      blurred = false,
      onBlurUnlock,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-surface relative aspect-[3/4] w-full select-none overflow-hidden rounded-2xl shadow-lg',
          className,
        )}
        {...props}
      >
        {/* Photo */}
        <img
          src={photo}
          alt={`${name}, ${age}`}
          className={cn(
            'h-full w-full object-cover transition-[filter] duration-300',
            blurred && 'scale-110 blur-[20px]',
          )}
          draggable={false}
        />

        {/* Blur unlock overlay */}
        {blurred && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-md">
                <svg
                  width="20"
                  height="20"
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
              {onBlurUnlock && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onBlurUnlock()
                  }}
                  className="rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] px-5 py-2 text-xs font-semibold text-white shadow-lg transition-transform active:scale-95"
                >
                  Upgrade to See
                </button>
              )}
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* LIKE / NOPE stamp */}
        {stamp === 'like' ? (
          <div
            className="border-like text-like absolute left-6 top-8 -rotate-12 rounded-lg border-4 px-4 py-2 text-3xl font-extrabold tracking-wider"
            style={{ opacity: stampOpacity }}
          >
            LIKE
          </div>
        ) : null}
        {stamp === 'nope' ? (
          <div
            className="border-danger text-danger absolute right-6 top-8 rotate-12 rounded-lg border-4 px-4 py-2 text-3xl font-extrabold tracking-wider"
            style={{ opacity: stampOpacity }}
          >
            NOPE
          </div>
        ) : null}

        {/* Info section */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold text-white">
                  {name}, {age}
                </h3>
                {verified ? (
                  <Badge variant="verified" size="sm">
                    Verified
                  </Badge>
                ) : null}
              </div>
              {distance ? <p className="mt-0.5 text-sm text-white/70">{distance}</p> : null}
              <div className="mt-2 flex gap-1.5">
                {zodiac ? (
                  <PillTag variant="zodiac" size="sm">
                    {zodiac}
                    {zodiacCompat !== undefined ? ` · ${zodiacCompat}%` : null}
                  </PillTag>
                ) : null}
              </div>
            </div>
            {matchPercent ? (
              <Badge variant="match" size="lg">
                {matchPercent}% Match
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
    )
  },
)
ProfileCard.displayName = 'ProfileCard'

export { ProfileCard }
export type { ProfileCardProps }
