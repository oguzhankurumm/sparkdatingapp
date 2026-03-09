import { Inject, Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common'
import * as Sentry from '@sentry/node'
import { eq, and, gte, sql } from 'drizzle-orm'
import { AI_RATE_LIMITS, type ProfileAnalysisResult } from '@spark/types'
import { DATABASE, type Database } from '../../database/database.module'
import { users, photos, aiLogs } from '../../database/schema'
import type { AiService } from './ai.service'

const MODEL = 'claude-sonnet-4-5'
const MAX_TOKENS = 1024

@Injectable()
export class ProfileAnalyzerService {
  private readonly logger = new Logger(ProfileAnalyzerService.name)

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly ai: AiService,
  ) {}

  /**
   * Analyze a user's profile quality and provide improvement suggestions.
   * Platinum only, 3/day limit enforced via DB.
   */
  async analyzeProfile(userId: string): Promise<ProfileAnalysisResult> {
    const startTime = Date.now()

    try {
      await this.enforceDailyLimit(userId)

      // Fetch user profile + photos
      const [user] = await this.db
        .select({
          firstName: users.firstName,
          bio: users.bio,
          interests: users.interests,
          relationshipGoal: users.relationshipGoal,
          isVerified: users.isVerified,
          voiceNoteUrl: users.voiceNoteUrl,
          videoProfileUrl: users.videoProfileUrl,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND)
      }

      const userPhotos = await this.db
        .select({
          id: photos.id,
          position: photos.position,
          moderationStatus: photos.moderationStatus,
        })
        .from(photos)
        .where(eq(photos.userId, userId))

      const system = `You are a dating profile expert for the Spark dating app. Analyze the user's profile and provide actionable improvement suggestions.

Scoring (0-100):
- overallScore: weighted average of all areas
- photoScore: quantity (2-6), variety, quality indicators
- bioScore: length (50-300 chars ideal), personality, authenticity
- promptsScore: completeness, creativity, conversation starters

Rules:
- Be constructive and encouraging, never harsh
- Focus on actionable, specific improvements
- Prioritize suggestions by expected impact on matches
- Consider dating app best practices
- Each suggestion should be 1-2 sentences

Return valid JSON:
{
  "overallScore": number,
  "photoScore": number,
  "bioScore": number,
  "promptsScore": number,
  "suggestions": [
    { "area": "photo"|"bio"|"prompts"|"interests"|"general", "priority": "high"|"medium"|"low", "suggestion": "..." }
  ]
}`

      const prompt = `Profile:
Name: ${user.firstName}
Bio: ${user.bio ?? '(empty)'}
Interests: ${user.interests?.join(', ') ?? '(none)'}
Relationship Goal: ${user.relationshipGoal ?? '(not set)'}
Photos: ${userPhotos.length} photo(s) uploaded${userPhotos.length > 0 ? ` (positions: ${userPhotos.map((p) => p.position).join(', ')})` : ''}
Verified: ${user.isVerified ? 'Yes' : 'No'}
Voice Note: ${user.voiceNoteUrl ? 'Yes' : 'No'}
Video Profile: ${user.videoProfileUrl ? 'Yes' : 'No'}

Analyze this profile and provide improvement suggestions.`

      const result = await this.ai.generateJson<ProfileAnalysisResult>({
        model: MODEL,
        system,
        prompt,
        maxTokens: MAX_TOKENS,
      })

      const latencyMs = Date.now() - startTime

      // Log for audit (fire and forget)
      this.logAnalysis(userId, prompt, JSON.stringify(result), latencyMs).catch((err) => {
        this.logger.warn('Failed to log profile analysis', err)
      })

      return result
    } catch (error) {
      if (error instanceof HttpException) throw error
      Sentry.captureException(error)
      this.logger.error('Failed to analyze profile', error)
      throw error
    }
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
          eq(aiLogs.feature, 'profile_analysis'),
          gte(aiLogs.createdAt, todayStart),
        ),
      )

    const count = rows[0]?.count ?? 0

    if (count >= AI_RATE_LIMITS.PROFILE_ANALYSIS_PER_DAY) {
      throw new HttpException(
        `Daily profile analysis limit reached (${AI_RATE_LIMITS.PROFILE_ANALYSIS_PER_DAY}/day). Try again tomorrow.`,
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }
  }

  private async logAnalysis(
    userId: string,
    prompt: string,
    response: string,
    latencyMs: number,
  ): Promise<void> {
    await this.db.insert(aiLogs).values({
      userId,
      feature: 'profile_analysis',
      prompt,
      response,
      model: MODEL,
      latencyMs,
    })
  }
}
