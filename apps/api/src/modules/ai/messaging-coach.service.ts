import { Inject, Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import * as Sentry from '@sentry/node'
import { eq, and, gte, sql } from 'drizzle-orm'
import Groq from 'groq-sdk'
import { AI_RATE_LIMITS, type MessagingCoachResponse } from '@spark/types'
import { DATABASE, type Database } from '../../database/database.module'
import { aiLogs } from '../../database/schema'

const MODEL = 'llama-3.1-70b-versatile'
const MAX_TOKENS = 256

@Injectable()
export class MessagingCoachService {
  private readonly logger = new Logger(MessagingCoachService.name)
  private readonly groq: Groq

  /** In-memory debounce tracker: userId → last request timestamp */
  private readonly debounceMap = new Map<string, number>()

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly config: ConfigService,
  ) {
    this.groq = new Groq({ apiKey: this.config.getOrThrow<string>('GROQ_API_KEY') })
  }

  /**
   * Get real-time messaging suggestions using Groq/Llama (~200ms).
   * Platinum only, 50/day limit, 800ms debounce.
   */
  async getSuggestions(
    userId: string,
    input: {
      partnerName: string
      recentMessages: { role: 'user' | 'partner'; content: string }[]
      draft?: string
    },
  ): Promise<MessagingCoachResponse> {
    const startTime = Date.now()

    try {
      // Enforce debounce (800ms between requests)
      this.enforceDebounce(userId)

      // Enforce daily limit (50/day)
      await this.enforceDailyLimit(userId)

      const conversationContext =
        input.recentMessages.length > 0
          ? input.recentMessages
              .slice(-6) // last 6 messages for context
              .map((m) => `${m.role === 'user' ? 'You' : input.partnerName}: ${m.content}`)
              .join('\n')
          : 'New conversation — no messages yet.'

      const draftContext = input.draft ? `\nCurrent draft: "${input.draft}"` : ''

      const response = await this.groq.chat.completions.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: `You are a real-time dating messaging coach. Give quick, natural reply suggestions.

Rules:
- Generate exactly 3 short suggestions (1-2 sentences each)
- Be natural and conversational — avoid clichés
- If a draft is provided, improve and offer alternatives
- Match the conversation's energy and tone
- Be fun, engaging, and authentic
- Never be creepy, aggressive, or inappropriate
- Include a brief context note (why these suggestions fit)

Return valid JSON: { "suggestions": ["msg1", "msg2", "msg3"], "context": "brief coaching note" }`,
          },
          {
            role: 'user',
            content: `Conversation with ${input.partnerName}:\n${conversationContext}${draftContext}\n\nSuggest 3 replies.`,
          },
        ],
        response_format: { type: 'json_object' },
      })

      const text = response.choices[0]?.message?.content
      if (!text) {
        throw new Error('No response from Groq')
      }

      const result = JSON.parse(text) as MessagingCoachResponse

      const latencyMs = Date.now() - startTime
      this.logger.debug(`Messaging coach: ${latencyMs}ms`)

      // Log for audit (fire and forget)
      this.logUsage(userId, latencyMs).catch((err) => {
        this.logger.warn('Failed to log messaging coach usage', err)
      })

      return {
        suggestions: result.suggestions.slice(0, 3),
        context: result.context ?? '',
      }
    } catch (error) {
      if (error instanceof HttpException) throw error
      Sentry.captureException(error)
      this.logger.error('Failed to get messaging coach suggestions', error)
      throw error
    }
  }

  private enforceDebounce(userId: string): void {
    const now = Date.now()
    const lastRequest = this.debounceMap.get(userId)

    if (lastRequest && now - lastRequest < AI_RATE_LIMITS.MESSAGING_COACH_DEBOUNCE_MS) {
      throw new HttpException('Please wait before requesting again', HttpStatus.TOO_MANY_REQUESTS)
    }

    this.debounceMap.set(userId, now)
  }

  private async enforceDailyLimit(userId: string): Promise<void> {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const rows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(aiLogs)
      .where(
        and(
          eq(aiLogs.userId, userId),
          eq(aiLogs.feature, 'messaging_coach'),
          gte(aiLogs.createdAt, todayStart),
        ),
      )

    const count = rows[0]?.count ?? 0

    if (count >= AI_RATE_LIMITS.MESSAGING_COACH_PER_DAY) {
      throw new HttpException(
        `Daily messaging coach limit reached (${AI_RATE_LIMITS.MESSAGING_COACH_PER_DAY}/day). Try again tomorrow.`,
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }
  }

  private async logUsage(userId: string, latencyMs: number): Promise<void> {
    await this.db.insert(aiLogs).values({
      userId,
      feature: 'messaging_coach',
      model: MODEL,
      latencyMs,
    })
  }
}
