import { forwardRef } from 'react'
import { cn } from '../utils/cn'

interface ZodiacBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  sign: string
  compatPercent?: number
}

const zodiacEmojis: Record<string, string> = {
  aries: '♈',
  taurus: '♉',
  gemini: '♊',
  cancer: '♋',
  leo: '♌',
  virgo: '♍',
  libra: '♎',
  scorpio: '♏',
  sagittarius: '♐',
  capricorn: '♑',
  aquarius: '♒',
  pisces: '♓',
}

const ZodiacBadge = forwardRef<HTMLSpanElement, ZodiacBadgeProps>(
  ({ className, sign, compatPercent, ...props }, ref) => {
    const emoji = zodiacEmojis[sign.toLowerCase()] ?? '⭐'

    return (
      <span
        ref={ref}
        className={cn(
          'bg-secondary/10 text-secondary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
          className,
        )}
        {...props}
      >
        <span>{emoji}</span>
        <span className="capitalize">{sign}</span>
        {compatPercent !== undefined ? <span className="font-bold">{compatPercent}%</span> : null}
      </span>
    )
  },
)
ZodiacBadge.displayName = 'ZodiacBadge'

export { ZodiacBadge }
export type { ZodiacBadgeProps }
