/** Zodiac types — shared across web, api, mobile */

export type ZodiacSign =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces'

export type ZodiacElement = 'fire' | 'earth' | 'air' | 'water'

export interface ZodiacInfo {
  sign: ZodiacSign
  emoji: string
  element: ZodiacElement
  dateRange: string
}

export interface ZodiacCompatibility {
  score: number
  label: string
  emoji: string
  description: string
  signA: ZodiacInfo
  signB: ZodiacInfo
}

/** Sign metadata for UI display */
export const ZODIAC_META: Record<
  ZodiacSign,
  { emoji: string; element: ZodiacElement; label: string }
> = {
  aries: { emoji: '♈', element: 'fire', label: 'Aries' },
  taurus: { emoji: '♉', element: 'earth', label: 'Taurus' },
  gemini: { emoji: '♊', element: 'air', label: 'Gemini' },
  cancer: { emoji: '♋', element: 'water', label: 'Cancer' },
  leo: { emoji: '♌', element: 'fire', label: 'Leo' },
  virgo: { emoji: '♍', element: 'earth', label: 'Virgo' },
  libra: { emoji: '♎', element: 'air', label: 'Libra' },
  scorpio: { emoji: '♏', element: 'water', label: 'Scorpio' },
  sagittarius: { emoji: '♐', element: 'fire', label: 'Sagittarius' },
  capricorn: { emoji: '♑', element: 'earth', label: 'Capricorn' },
  aquarius: { emoji: '♒', element: 'air', label: 'Aquarius' },
  pisces: { emoji: '♓', element: 'water', label: 'Pisces' },
}

/** Compatibility score color tier thresholds */
export function getCompatibilityTier(score: number): 'high' | 'medium' | 'low' {
  if (score >= 80) return 'high'
  if (score >= 50) return 'medium'
  return 'low'
}
