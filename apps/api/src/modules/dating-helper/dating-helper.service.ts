import { Inject, Injectable, Logger } from '@nestjs/common'
import * as Sentry from '@sentry/node'
import { eq } from 'drizzle-orm'
import { DATABASE, type Database } from '../../database/database.module'
import { datingHelperLogs, users, matches } from '../../database/schema'
import type { AiService } from '../ai/ai.service'
import type { GetSuggestionsInput } from './dto'

const MODEL = 'claude-sonnet-4-5'
const MAX_TOKENS = 512

export interface SuggestionsResult {
  suggestions: string[]
  tone: string
}

@Injectable()
export class DatingHelperService {
  private readonly logger = new Logger(DatingHelperService.name)

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly ai: AiService,
  ) {}

  /**
   * Generate AI-powered message suggestions for a chat.
   * Uses conversation context + partner profile to craft personalized suggestions.
   */
  async getSuggestions(userId: string, input: GetSuggestionsInput): Promise<SuggestionsResult> {
    const startTime = Date.now()

    try {
      // Fetch partner info from the match
      const partnerContext = await this.getPartnerContext(input.matchId, userId)

      const tone = input.tone ?? 'casual'

      const system = `You are a dating coach AI for the Spark dating app. Your job is to help users craft engaging, authentic messages that lead to meaningful connections.

Rules:
- Generate exactly 3 message suggestions
- Each message should be 1-2 sentences max
- Match the requested tone: ${tone}
- Be natural and conversational — avoid clichés and pickup lines
- If conversation history is provided, make suggestions contextually relevant
- If no conversation exists, suggest good conversation openers
- Never be creepy, aggressive, or inappropriate
- Adapt to the partner's interests and profile when available

Respond in valid JSON: { "suggestions": ["msg1", "msg2", "msg3"] }`

      const conversationContext =
        input.recentMessages.length > 0
          ? input.recentMessages
              .map((m) => `${m.role === 'user' ? 'You' : partnerContext.name}: ${m.content}`)
              .join('\n')
          : 'No messages yet — this is a new match.'

      const prompt = `Partner: ${partnerContext.name}${partnerContext.bio ? `\nBio: ${partnerContext.bio}` : ''}${partnerContext.interests?.length ? `\nInterests: ${partnerContext.interests.join(', ')}` : ''}

Conversation:
${conversationContext}

Tone: ${tone}

Generate 3 message suggestions.`

      const result = await this.ai.generateJson<{ suggestions: string[] }>({
        model: MODEL,
        system,
        prompt,
        maxTokens: MAX_TOKENS,
      })

      const latencyMs = Date.now() - startTime

      // Log for audit (fire and forget)
      this.logSuggestion(userId, prompt, JSON.stringify(result), latencyMs).catch((err) => {
        this.logger.warn('Failed to log dating helper usage', err)
      })

      return {
        suggestions: result.suggestions.slice(0, 3),
        tone,
      }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to generate dating helper suggestions', error)
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

    if (!match) {
      return { name: 'your match', bio: null, interests: null }
    }

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

  /**
   * Log AI usage for audit and analytics.
   */
  private async logSuggestion(
    userId: string,
    prompt: string,
    response: string,
    latencyMs: number,
  ): Promise<void> {
    await this.db.insert(datingHelperLogs).values({
      userId,
      prompt,
      response,
      model: MODEL,
      latencyMs,
    })
  }
}
