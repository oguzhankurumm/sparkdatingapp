import { Injectable } from '@nestjs/common'

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

const ZODIAC_DATA: Record<ZodiacSign, Omit<ZodiacInfo, 'sign'>> = {
  aries: { emoji: '♈', element: 'fire', dateRange: 'Mar 21 – Apr 19' },
  taurus: { emoji: '♉', element: 'earth', dateRange: 'Apr 20 – May 20' },
  gemini: { emoji: '♊', element: 'air', dateRange: 'May 21 – Jun 20' },
  cancer: { emoji: '♋', element: 'water', dateRange: 'Jun 21 – Jul 22' },
  leo: { emoji: '♌', element: 'fire', dateRange: 'Jul 23 – Aug 22' },
  virgo: { emoji: '♍', element: 'earth', dateRange: 'Aug 23 – Sep 22' },
  libra: { emoji: '♎', element: 'air', dateRange: 'Sep 23 – Oct 22' },
  scorpio: { emoji: '♏', element: 'water', dateRange: 'Oct 23 – Nov 21' },
  sagittarius: { emoji: '♐', element: 'fire', dateRange: 'Nov 22 – Dec 21' },
  capricorn: { emoji: '♑', element: 'earth', dateRange: 'Dec 22 – Jan 19' },
  aquarius: { emoji: '♒', element: 'air', dateRange: 'Jan 20 – Feb 18' },
  pisces: { emoji: '♓', element: 'water', dateRange: 'Feb 19 – Mar 20' },
}

// Date boundaries: [month, day] — sign starts on this date
const SIGN_BOUNDARIES: Array<{ month: number; day: number; sign: ZodiacSign }> = [
  { month: 1, day: 20, sign: 'aquarius' },
  { month: 2, day: 19, sign: 'pisces' },
  { month: 3, day: 21, sign: 'aries' },
  { month: 4, day: 20, sign: 'taurus' },
  { month: 5, day: 21, sign: 'gemini' },
  { month: 6, day: 21, sign: 'cancer' },
  { month: 7, day: 23, sign: 'leo' },
  { month: 8, day: 23, sign: 'virgo' },
  { month: 9, day: 23, sign: 'libra' },
  { month: 10, day: 23, sign: 'scorpio' },
  { month: 11, day: 22, sign: 'sagittarius' },
  { month: 12, day: 22, sign: 'capricorn' },
]

// Element compatibility matrix (base scores)
// Same element = high, complementary = medium, neutral = lower, opposing = lowest
const ELEMENT_COMPAT: Record<ZodiacElement, Record<ZodiacElement, number>> = {
  fire: { fire: 90, air: 85, earth: 55, water: 45 },
  earth: { earth: 90, water: 85, fire: 55, air: 45 },
  air: { air: 90, fire: 85, water: 55, earth: 45 },
  water: { water: 90, earth: 85, air: 55, fire: 45 },
}

// Special sign-pair bonuses/penalties (well-known astrological pairings)
const SPECIAL_PAIRS: Record<string, number> = {
  'aries-leo': 5,
  'aries-sagittarius': 5,
  'taurus-virgo': 5,
  'taurus-capricorn': 5,
  'gemini-libra': 5,
  'gemini-aquarius': 5,
  'cancer-scorpio': 5,
  'cancer-pisces': 5,
  'leo-sagittarius': 5,
  'virgo-capricorn': 5,
  'libra-aquarius': 5,
  'scorpio-pisces': 5,
  // Classic "opposites attract" pairs get a small boost
  'aries-libra': 3,
  'taurus-scorpio': 3,
  'gemini-sagittarius': 3,
  'cancer-capricorn': 3,
  'leo-aquarius': 3,
  'virgo-pisces': 3,
}

@Injectable()
export class ZodiacService {
  getSignFromBirthday(birthday: string | Date): ZodiacSign {
    const d = typeof birthday === 'string' ? new Date(birthday) : birthday
    const month = d.getUTCMonth() + 1 // 1-indexed
    const day = d.getUTCDate()

    // Walk backwards through boundaries to find the sign
    for (let i = SIGN_BOUNDARIES.length - 1; i >= 0; i--) {
      const b = SIGN_BOUNDARIES[i]!
      if (month > b.month || (month === b.month && day >= b.day)) {
        return b.sign
      }
    }
    // If before Jan 20, it's Capricorn (from Dec 22 – Jan 19)
    return 'capricorn'
  }

  getSignInfo(sign: ZodiacSign): ZodiacInfo {
    return { sign, ...ZODIAC_DATA[sign] }
  }

  getCompatibility(signA: ZodiacSign, signB: ZodiacSign): ZodiacCompatibility {
    const infoA = this.getSignInfo(signA)
    const infoB = this.getSignInfo(signB)

    // Base score from element compatibility
    let score = ELEMENT_COMPAT[infoA.element][infoB.element]

    // Same sign bonus
    if (signA === signB) {
      score = 82 // Same sign: good but not perfect — you mirror each other
    }

    // Special pair adjustments
    const pairKey = [signA, signB].sort().join('-')
    const bonus = SPECIAL_PAIRS[pairKey]
    if (bonus) {
      score = Math.min(98, score + bonus)
    }

    // Add small deterministic variance based on sign pair hash (±3 points)
    const hash = this.pairHash(signA, signB)
    const variance = (hash % 7) - 3 // -3 to +3
    score = Math.max(20, Math.min(98, score + variance))

    const { label, emoji, description } = this.getCompatLabel(score, infoA, infoB)

    return { score, label, emoji, description, signA: infoA, signB: infoB }
  }

  private pairHash(a: string, b: string): number {
    const str = [a, b].sort().join('')
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) | 0
    }
    return Math.abs(hash)
  }

  private getCompatLabel(
    score: number,
    a: ZodiacInfo,
    b: ZodiacInfo,
  ): { label: string; emoji: string; description: string } {
    if (score >= 85) {
      return {
        label: 'Soulmate Match',
        emoji: '🔥',
        description: `${a.emoji} ${this.capitalize(a.sign)} & ${b.emoji} ${this.capitalize(b.sign)} share incredible chemistry. This connection has soulmate potential.`,
      }
    }
    if (score >= 70) {
      return {
        label: 'Great Match',
        emoji: '✨',
        description: `${a.emoji} ${this.capitalize(a.sign)} & ${b.emoji} ${this.capitalize(b.sign)} complement each other beautifully. Expect a strong, harmonious bond.`,
      }
    }
    if (score >= 55) {
      return {
        label: 'Good Match',
        emoji: '💫',
        description: `${a.emoji} ${this.capitalize(a.sign)} & ${b.emoji} ${this.capitalize(b.sign)} have solid potential. With effort, this connection can truly blossom.`,
      }
    }
    return {
      label: 'Opposites Attract',
      emoji: '⚡',
      description: `${a.emoji} ${this.capitalize(a.sign)} & ${b.emoji} ${this.capitalize(b.sign)} are different, but that sparks excitement. Growth comes from embracing differences.`,
    }
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1)
  }
}
