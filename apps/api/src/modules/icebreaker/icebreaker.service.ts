import { Injectable, Logger, NotFoundException, BadRequestException, Inject } from '@nestjs/common'
import { eq, and, or } from 'drizzle-orm'
import { DATABASE, type Database } from '../../database/database.module'
import { matches, users, type Match, type User } from '../../database/schema'
import type { AiService } from '../ai/ai.service'

// ── Zodiac helper ─────────────────────────────

const ZODIAC_SIGNS = [
  { sign: 'Capricorn', from: [1, 1], to: [1, 19] },
  { sign: 'Aquarius', from: [1, 20], to: [2, 18] },
  { sign: 'Pisces', from: [2, 19], to: [3, 20] },
  { sign: 'Aries', from: [3, 21], to: [4, 19] },
  { sign: 'Taurus', from: [4, 20], to: [5, 20] },
  { sign: 'Gemini', from: [5, 21], to: [6, 20] },
  { sign: 'Cancer', from: [6, 21], to: [7, 22] },
  { sign: 'Leo', from: [7, 23], to: [8, 22] },
  { sign: 'Virgo', from: [8, 23], to: [9, 22] },
  { sign: 'Libra', from: [9, 23], to: [10, 22] },
  { sign: 'Scorpio', from: [10, 23], to: [11, 21] },
  { sign: 'Sagittarius', from: [11, 22], to: [12, 21] },
  { sign: 'Capricorn', from: [12, 22], to: [12, 31] },
] as const

function getZodiacSign(birthday: string): string {
  const d = new Date(birthday)
  const month = d.getMonth() + 1
  const day = d.getDate()

  for (const z of ZODIAC_SIGNS) {
    const afterFrom = month > z.from[0] || (month === z.from[0] && day >= z.from[1])
    const beforeTo = month < z.to[0] || (month === z.to[0] && day <= z.to[1])
    if (afterFrom && beforeTo) return z.sign
  }

  return 'Unknown'
}

// ── Redis key helpers ─────────────────────────

function cacheKey(matchId: string) {
  return `icebreaker:${matchId}` as const
}
function refreshCountKey(matchId: string) {
  return `icebreaker:refresh:${matchId}` as const
}

const MAX_REFRESHES = 3
const CACHE_TTL_SECONDS = 24 * 60 * 60 // 24 hours

// ── Service ───────────────────────────────────

interface IcebreakerSuggestions {
  suggestions: string[]
}

@Injectable()
export class IcebreakerService {
  private readonly logger = new Logger(IcebreakerService.name)

  // Simple in-memory cache (swap for Redis in production)
  private cache = new Map<string, { value: IcebreakerSuggestions; expiresAt: number }>()
  private refreshCounts = new Map<string, number>()

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly ai: AiService,
  ) {}

  async generateIcebreakers(
    matchId: string,
    currentUserId: string,
  ): Promise<{ suggestions: string[]; refreshesRemaining: number }> {
    // 1. Check cache
    const cached = this.cache.get(cacheKey(matchId))
    if (cached && cached.expiresAt > Date.now()) {
      const used = this.refreshCounts.get(refreshCountKey(matchId)) ?? 0
      return {
        suggestions: cached.value.suggestions,
        refreshesRemaining: Math.max(0, MAX_REFRESHES - used),
      }
    }

    // 2. Check refresh limit
    const refreshCount = this.refreshCounts.get(refreshCountKey(matchId)) ?? 0
    if (refreshCount >= MAX_REFRESHES) {
      throw new BadRequestException('Maximum icebreaker refreshes reached for this match')
    }

    // 3. Fetch match + both users
    const match = await this.db
      .select()
      .from(matches)
      .where(
        and(
          eq(matches.id, matchId),
          eq(matches.status, 'active'),
          or(eq(matches.user1Id, currentUserId), eq(matches.user2Id, currentUserId)),
        ),
      )
      .then((rows: Match[]) => rows[0])

    if (!match) {
      throw new NotFoundException('Match not found')
    }

    const partnerId = match.user1Id === currentUserId ? match.user2Id : match.user1Id

    const [currentUserData, partnerData] = await Promise.all([
      this.db
        .select()
        .from(users)
        .where(eq(users.id, currentUserId))
        .then((r: User[]) => r[0]),
      this.db
        .select()
        .from(users)
        .where(eq(users.id, partnerId))
        .then((r: User[]) => r[0]),
    ])

    if (!currentUserData || !partnerData) {
      throw new NotFoundException('User not found')
    }

    // 4. Build profile summaries
    const userA = this.buildProfileSummary(currentUserData)
    const userB = this.buildProfileSummary(partnerData)
    const commonInterests = this.findCommonInterests(
      currentUserData.interests,
      partnerData.interests,
    )

    // 5. Call Claude
    const prompt = this.buildPrompt(userA, userB, commonInterests)
    const result = await this.ai.generateJson<IcebreakerSuggestions>({
      model: 'claude-haiku-4-5-20251001',
      system:
        'You are a charming dating coach. Always respond with valid JSON. Never include anything outside the JSON object.',
      prompt,
      maxTokens: 256,
    })

    // 6. Cache result
    this.cache.set(cacheKey(matchId), {
      value: result,
      expiresAt: Date.now() + CACHE_TTL_SECONDS * 1000,
    })
    this.refreshCounts.set(refreshCountKey(matchId), refreshCount + 1)

    this.logger.log(
      `Generated icebreakers for match ${matchId} (refresh ${refreshCount + 1}/${MAX_REFRESHES})`,
    )

    return {
      suggestions: result.suggestions,
      refreshesRemaining: Math.max(0, MAX_REFRESHES - (refreshCount + 1)),
    }
  }

  // ── Helpers ───────────────────────────────────

  private buildProfileSummary(user: User): string {
    const parts: string[] = []
    parts.push(`Name: ${user.firstName}`)
    if (user.birthday) parts.push(`Zodiac: ${getZodiacSign(user.birthday)}`)
    if (user.bio) parts.push(`Bio: ${user.bio}`)
    if (user.interests?.length) parts.push(`Interests: ${user.interests.join(', ')}`)
    if (user.relationshipGoal) parts.push(`Looking for: ${user.relationshipGoal.replace('_', ' ')}`)
    if (user.city) parts.push(`City: ${user.city}`)
    return parts.join('\n')
  }

  private findCommonInterests(a?: string[] | null, b?: string[] | null): string[] {
    if (!a || !b) return []
    const setB = new Set(b)
    return a.filter((interest) => setB.has(interest))
  }

  private buildPrompt(userA: string, userB: string, commonInterests: string[]): string {
    const commonPart =
      commonInterests.length > 0
        ? `Common interests: ${commonInterests.join(', ')}`
        : 'No obvious common interests found'

    return `Two people just matched on a dating app:

User A:
${userA}

User B:
${userB}

${commonPart}

Generate 3 different opening message suggestions that User A could send to User B:
1. Humorous / playful
2. Warm / sincere
3. Based on shared interests or profile details

Rules:
- Each suggestion must be max 80 characters
- Write in a natural, casual tone
- Don't use emojis excessively (max 1 per message)
- Make them feel personal, not generic

Respond ONLY with JSON: { "suggestions": ["...", "...", "..."] }`
  }
}
