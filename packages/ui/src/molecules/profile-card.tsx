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
  distance?: string
  verified?: boolean
  stamp?: 'like' | 'nope' | null
  stampOpacity?: number
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
      distance,
      verified,
      stamp,
      stampOpacity = 0,
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
          className="h-full w-full object-cover"
          draggable={false}
        />

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
