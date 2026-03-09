import { Inject, Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common'
import * as Sentry from '@sentry/node'
import { eq } from 'drizzle-orm'
import {
  AI_RATE_LIMITS,
  type CompatibilityScoreResult,
  type CompatibilityScoreResponse,
  type SubscriptionPlan,
} from '@spark/types'
import { DATABASE, type Database } from '../../database/database.module'
import { users, matches, aiLogs } from '../../database/schema'
import type { AiService } from './ai.service'

const HAIKU_MODEL = 'claude-haiku-4-5-20251001'
const MAX_TOKENS = 512
const CACHE_TTL_MS = AI_RATE_LIMITS.COMPATIBILITY_SCORE_CACHE_HOURS * 60 * 60 * 1000

interface CacheEntry {
  result: CompatibilityScoreResult
  expiresAt: number
}

@Injectable()
export class CompatibilityScoreService {
  private readonly logger = new Logger(CompatibilityScoreService.name)

  /** In-memory cache: key = `compat:sortedUserA:sortedUserB` */
  private readonly cache = new Map<string, CacheEntry>()

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly ai: AiService,
  ) {}

  /**
   * Get AI compatibility score for a match.
   * Platinum users see full details (reasons + dealbreakers), others see score only.
   */
  async getCompatibilityScore(
    matchId: string,
    userId: string,
    userPlan: SubscriptionPlan,
  ): Promise<CompatibilityScoreResponse> {
    const startTime = Date.now()

    try {
      // Get match and determine partner
      const [match] = await this.db.select().from(matches).where(eq(matches.id, matchId)).limit(1)

      if (!match) {
        throw new HttpException('Match not found', HttpStatus.NOT_FOUND)
      }

      if (match.user1Id !== userId && match.user2Id !== userId) {
        throw new HttpException('Not your match', HttpStatus.FORBIDDEN)
      }

      const partnerId = match.user1Id === userId ? match.user2Id : match.user1Id

      // Check cache (sorted key ensures same pair = same cache entry)
      const cacheKey = this.buildCacheKey(userId, partnerId)
      const cached = this.cache.get(cacheKey)

      if (cached && cached.expiresAt > Date.now()) {
        return this.filterByPlan(cached.result, userPlan)
      }

      // Fetch both user profiles
      const [userProfile, partnerProfile] = await Promise.all([
        this.getUserProfile(userId),
        this.getUserProfile(partnerId),
      ])

      if (!userProfile || !partnerProfile) {
        throw new HttpException('User profile not found', HttpStatus.NOT_FOUND)
      }

      const system = `You are a dating compatibility analyzer for the Spark dating app. Analyze two users' profiles and produce a compatibility score.

Scoring criteria (0-100):
- Shared interests alignment (30%)
- Relationship goal compatibility (25%)
- Age compatibility within preferences (15%)
- Location proximity relevance (10%)
- Lifestyle and personality indicators from bio (20%)

Rules:
- Score 80-100: Highly compatible
- Score 60-79: Good potential
- Score 40-59: Some differences
- Score below 40: Significant mismatches
- Provide 2-4 specific reasons for compatibility
- Note 0-2 potential dealbreakers (only if genuinely applicable)
- Be honest but constructive — never harsh or discouraging
- Keep reasons and dealbreakers concise (1 sentence each)

Return valid JSON:
{
  "score": number,
  "reasons": ["reason1", "reason2"],
  "dealbreakers": ["issue1"]
}`

      const prompt = `User A:
Name: ${userProfile.firstName}
Bio: ${userProfile.bio ?? '(not set)'}
Interests: ${userProfile.interests?.join(', ') ?? '(none)'}
Relationship Goal: ${userProfile.relationshipGoal ?? '(not set)'}
Age: ${userProfile.age ?? 'unknown'}

User B:
Name: ${partnerProfile.firstName}
Bio: ${partnerProfile.bio ?? '(not set)'}
Interests: ${partnerProfile.interests?.join(', ') ?? '(none)'}
Relationship Goal: ${partnerProfile.relationshipGoal ?? '(not set)'}
Age: ${partnerProfile.age ?? 'unknown'}

Analyze compatibility between these two users.`

      const result = await this.ai.generateJson<CompatibilityScoreResult>({
        model: HAIKU_MODEL,
        system,
        prompt,
        maxTokens: MAX_TOKENS,
      })

      // Clamp score to 0-100
      result.score = Math.max(0, Math.min(100, Math.round(result.score)))

      // Cache result
      this.cache.set(cacheKey, {
        result,
        expiresAt: Date.now() + CACHE_TTL_MS,
      })

      const latencyMs = Date.now() - startTime

      // Log for audit (fire and forget)
      this.logScore(userId, matchId, JSON.stringify(result), latencyMs).catch((err) => {
        this.logger.warn('Failed to log compatibility score', err)
      })

      return this.filterByPlan(result, userPlan)
    } catch (error) {
      if (error instanceof HttpException) throw error
      Sentry.captureException(error)
      this.logger.error('Failed to compute compatibility score', error)
      throw error
    }
  }

  private buildCacheKey(userA: string, userB: string): string {
    const sorted = [userA, userB].sort()
    return `compat:${sorted[0]}:${sorted[1]}`
  }

  private filterByPlan(
    result: CompatibilityScoreResult,
    plan: SubscriptionPlan,
  ): CompatibilityScoreResponse {
    if (plan === 'platinum') {
      return {
        score: result.score,
        reasons: result.reasons,
        dealbreakers: result.dealbreakers,
      }
    }
    return { score: result.score }
  }

  private async getUserProfile(userId: string) {
    const [user] = await this.db
      .select({
        firstName: users.firstName,
        bio: users.bio,
        interests: users.interests,
        relationshipGoal: users.relationshipGoal,
        birthday: users.birthday,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) return null

    // Calculate age from birthday
    let age: number | null = null
    if (user.birthday) {
      const birthDate = new Date(user.birthday)
      const today = new Date()
      age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
    }

    return {
      firstName: user.firstName,
      bio: user.bio,
      interests: user.interests,
      relationshipGoal: user.relationshipGoal,
      age,
    }
  }

  private async logScore(
    userId: string,
    matchId: string,
    response: string,
    latencyMs: number,
  ): Promise<void> {
    await this.db.insert(aiLogs).values({
      userId,
      feature: 'compatibility_score',
      prompt: `matchId:${matchId}`,
      response,
      model: HAIKU_MODEL,
      latencyMs,
    })
  }
}
