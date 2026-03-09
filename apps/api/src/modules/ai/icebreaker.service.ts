import {
  Inject,
  Injectable,
  Logger,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import * as Sentry from '@sentry/node'
import { eq } from 'drizzle-orm'
import { DATABASE, type Database } from '../../database/database.module'
import { matches, users } from '../../database/schema'
import type { AiService } from './ai.service'
import type { MatchingService } from '../matching/matching.service'

const HAIKU_MODEL = 'claude-haiku-4-5-20251001'

// 1 initial + 3 refreshes = 4 total requests per user per match
const MAX_TOTAL_REQUESTS = 4

export interface IcebreakerResult {
  suggestions: string[]
  refreshesRemaining: number
}

@Injectable()
export class IcebreakerService {
  private readonly logger = new Logger(IcebreakerService.name)

  /** Tracks request count per `userId:matchId` to enforce refresh limit */
  private readonly requestCountMap = new Map<string, number>()

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly ai: AiService,
    private readonly matchingService: MatchingService,
  ) {}

  /**
   * Generate 3 AI-powered conversation openers for a match.
   * Max 4 requests per user per match (1 initial + 3 refreshes).
   */
  async generateIcebreakers(userId: string, matchId: string): Promise<IcebreakerResult> {
    try {
      // Verify user has access to this match
      await this.matchingService.verifyMatchAccess(matchId, userId)

      // Enforce refresh limit
      const key = `${userId}:${matchId}`
      const currentCount = this.requestCountMap.get(key) ?? 0

      if (currentCount >= MAX_TOTAL_REQUESTS) {
        throw new HttpException(
          'Icebreaker refresh limit reached for this match',
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }

      // Fetch partner context for personalized openers
      const partner = await this.getPartnerContext(matchId, userId)

      const system = `You are a dating conversation starter for the Spark dating app. Generate exactly 3 creative, fun conversation openers.

Rules:
- Each opener should be 1-2 sentences max
- Be natural, warm, and engaging
- Reference the partner's interests or bio when available
- Avoid generic greetings like "Hey, how are you?"
- Never be creepy, overly sexual, or aggressive
- Mix different styles: question, compliment, observation, humor
- Make openers feel personal and thoughtful

Respond in valid JSON: { "suggestions": ["opener1", "opener2", "opener3"] }`

      const prompt = `Partner: ${partner.name}${partner.bio ? `\nBio: ${partner.bio}` : ''}${partner.interests?.length ? `\nInterests: ${partner.interests.join(', ')}` : ''}

Generate 3 unique conversation starters.`

      const result = await this.ai.generateJson<{ suggestions: string[] }>({
        model: HAIKU_MODEL,
        system,
        prompt,
        maxTokens: 256,
      })

      // Track usage
      const newCount = currentCount + 1
      this.requestCountMap.set(key, newCount)

      return {
        suggestions: result.suggestions.slice(0, 3),
        refreshesRemaining: MAX_TOTAL_REQUESTS - newCount,
      }
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof HttpException) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error('Failed to generate icebreakers', error)
      throw error
    }
  }

  /**
   * Fetch partner name, bio, and interests from the match.
   */
  private async getPartnerContext(
    matchId: string,
    userId: string,
  ): Promise<{ name: string; bio: string | null; interests: string[] | null }> {
    const [match] = await this.db.select().from(matches).where(eq(matches.id, matchId)).limit(1)

    if (!match) return { name: 'your match', bio: null, interests: null }

    const partnerId = match.user1Id === userId ? match.user2Id : match.user1Id

    const [partner] = await this.db
      .select({
        firstName: users.firstName,
        bio: users.bio,
        interests: users.interests,
      })
      .from(users)
      .where(eq(users.id, partnerId))
      .limit(1)

    return {
      name: partner?.firstName ?? 'your match',
      bio: partner?.bio ?? null,
      interests: partner?.interests ?? null,
    }
  }
}
