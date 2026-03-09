import { Inject, Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common'
import * as Sentry from '@sentry/node'
import { eq, and, gte, sql } from 'drizzle-orm'
import {
  AI_RATE_LIMITS,
  type SubscriptionPlan,
  type DatePlanResponse,
  type DatePlanOption,
} from '@spark/types'
import { DATABASE, type Database } from '../../database/database.module'
import { users, matches, aiLogs } from '../../database/schema'
import type { AiService } from './ai.service'

const SONNET_MODEL = 'claude-sonnet-4-5'
const MAX_TOKENS = 1024

@Injectable()
export class DatePlannerService {
  private readonly logger = new Logger(DatePlannerService.name)

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly ai: AiService,
  ) {}

  /**
   * Generate 3 date plan options (romantic / fun / calm) for a match.
   * Platinum: 3/day, Premium: 1/day, Free: blocked (enforced by PlanGuard).
   */
  async generateDatePlans(
    matchId: string,
    userId: string,
    userPlan: SubscriptionPlan,
  ): Promise<DatePlanResponse> {
    const startTime = Date.now()

    try {
      // Enforce daily limit based on plan
      await this.enforceDailyLimit(userId, userPlan)

      // Get match context
      const [match] = await this.db.select().from(matches).where(eq(matches.id, matchId)).limit(1)

      if (!match) {
        throw new HttpException('Match not found', HttpStatus.NOT_FOUND)
      }

      if (match.user1Id !== userId && match.user2Id !== userId) {
        throw new HttpException('Not your match', HttpStatus.FORBIDDEN)
      }

      const partnerId = match.user1Id === userId ? match.user2Id : match.user1Id

      // Fetch both profiles for context
      const [userProfile, partnerProfile] = await Promise.all([
        this.getUserProfile(userId),
        this.getUserProfile(partnerId),
      ])

      if (!userProfile || !partnerProfile) {
        throw new HttpException('User profile not found', HttpStatus.NOT_FOUND)
      }

      const system = `You are a creative date planner for the Spark dating app. Generate exactly 3 unique date plan options.

Each plan must be one of these types:
- "romantic": Intimate, thoughtful, and memorable
- "fun": Active, playful, and energetic
- "calm": Relaxed, cozy, and low-key

Guidelines:
- Personalize based on shared interests and preferences
- Consider the users' city/location if available
- Include 2-3 specific venue suggestions per plan
- Provide realistic cost estimates
- Be creative — avoid cliché "dinner and a movie"
- Make plans feel exciting and achievable
- Each description should be 2-3 sentences

Return valid JSON:
{
  "plans": [
    {
      "type": "romantic" | "fun" | "calm",
      "title": "short catchy title",
      "description": "2-3 sentence description",
      "venues": [
        { "name": "venue name", "category": "category", "priceRange": "$" | "$$" | "$$$" }
      ],
      "estimatedCost": "$XX-YY"
    }
  ]
}`

      const prompt = `Plan a date for these two people:

Person 1 (${userProfile.firstName}):
Bio: ${userProfile.bio ?? '(not set)'}
Interests: ${userProfile.interests?.join(', ') ?? '(none)'}
Relationship Goal: ${userProfile.relationshipGoal ?? '(not set)'}
City: ${userProfile.city ?? '(unknown)'}

Person 2 (${partnerProfile.firstName}):
Bio: ${partnerProfile.bio ?? '(not set)'}
Interests: ${partnerProfile.interests?.join(', ') ?? '(none)'}
Relationship Goal: ${partnerProfile.relationshipGoal ?? '(not set)'}
City: ${partnerProfile.city ?? '(unknown)'}

Generate 3 date plans: one romantic, one fun, one calm.`

      const result = await this.ai.generateJson<{ plans: DatePlanOption[] }>({
        model: SONNET_MODEL,
        system,
        prompt,
        maxTokens: MAX_TOKENS,
      })

      // Ensure exactly 3 plans
      const plans = result.plans.slice(0, 3)

      const latencyMs = Date.now() - startTime

      // Log for audit + rate limiting (fire and forget)
      this.logPlan(userId, matchId, JSON.stringify(plans), latencyMs).catch((err) => {
        this.logger.warn('Failed to log date plan', err)
      })

      return { plans }
    } catch (error) {
      if (error instanceof HttpException) throw error
      Sentry.captureException(error)
      this.logger.error('Failed to generate date plans', error)
      throw error
    }
  }

  private async enforceDailyLimit(userId: string, plan: SubscriptionPlan): Promise<void> {
    const limit =
      plan === 'platinum'
        ? AI_RATE_LIMITS.DATE_PLAN_PLATINUM_PER_DAY
        : AI_RATE_LIMITS.DATE_PLAN_PREMIUM_PER_DAY

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const rows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(aiLogs)
      .where(
        and(
          eq(aiLogs.userId, userId),
          eq(aiLogs.feature, 'date_plan'),
          gte(aiLogs.createdAt, todayStart),
        ),
      )

    const count = rows[0]?.count ?? 0

    if (count >= limit) {
      throw new HttpException(
        `Daily date plan limit reached (${limit}/day). Try again tomorrow.`,
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }
  }

  private async getUserProfile(userId: string) {
    const [user] = await this.db
      .select({
        firstName: users.firstName,
        bio: users.bio,
        interests: users.interests,
        relationshipGoal: users.relationshipGoal,
        city: users.city,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    return user ?? null
  }

  private async logPlan(
    userId: string,
    matchId: string,
    response: string,
    latencyMs: number,
  ): Promise<void> {
    await this.db.insert(aiLogs).values({
      userId,
      feature: 'date_plan',
      prompt: `matchId:${matchId}`,
      response,
      model: SONNET_MODEL,
      latencyMs,
    })
  }
}
