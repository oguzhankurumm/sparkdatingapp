import { Inject, Injectable, Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import { eq } from 'drizzle-orm'
import * as Sentry from '@sentry/node'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { DATABASE, type Database } from '../../database/database.module'
import { photos } from '../../database/schema'
import type { AiService } from '../ai/ai.service'
import type { ToxicityCheckResult, PhotoModerationResult } from '@spark/types'

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name)
  private readonly gemini: GoogleGenerativeAI

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly ai: AiService,
    private readonly config: ConfigService,
  ) {
    this.gemini = new GoogleGenerativeAI(this.config.getOrThrow<string>('GEMINI_API_KEY'))
  }

  /**
   * Check text message for toxicity using Claude Haiku.
   * Target: <300ms. Fail-open: if AI fails, message passes through.
   */
  async checkToxicity(content: string): Promise<ToxicityCheckResult> {
    const startTime = Date.now()

    try {
      const result = await this.ai.generateJson<ToxicityCheckResult>({
        model: 'claude-haiku-4-5-20251001',
        maxTokens: 128,
        system: `You are a content safety classifier for a dating app. Analyze messages for toxicity.

Categories to detect: harassment, hate_speech, sexual_explicit, threats, spam, scam, self_harm

Rules:
- Be strict on harassment, threats, hate_speech
- Allow flirting and romantic language (this is a dating app)
- Flag explicit sexual content only if unsolicited/aggressive
- Score 0.0 (safe) to 1.0 (definitely toxic)
- isToxic = true if score >= 0.7
- Return valid JSON only

JSON format: { "isToxic": boolean, "score": number, "categories": string[], "reason": string | null }`,
        prompt: `Classify this message:\n"${content}"`,
      })

      const latencyMs = Date.now() - startTime
      this.logger.debug(`Toxicity check: ${latencyMs}ms, toxic=${result.isToxic}`)

      return result
    } catch (error) {
      const latencyMs = Date.now() - startTime
      this.logger.warn(`Toxicity check failed (${latencyMs}ms), fail-open`, error)
      Sentry.captureException(error)

      // Fail-open: allow message through if AI is unavailable
      return { isToxic: false, score: 0, categories: [], reason: null }
    }
  }

  /**
   * Moderate a photo using Google Gemini Vision.
   * Analyzes image for inappropriate content and updates the photo record.
   */
  async moderatePhoto(photoId: string, imageUrl: string): Promise<PhotoModerationResult> {
    const startTime = Date.now()

    try {
      const model = this.gemini.getGenerativeModel({
        model: 'gemini-1.5-flash',
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      })

      // Fetch image as base64
      const response = await fetch(imageUrl)
      const buffer = Buffer.from(await response.arrayBuffer())
      const base64 = buffer.toString('base64')
      const mimeType = response.headers.get('content-type') ?? 'image/jpeg'

      const prompt = `You are a photo moderator for a dating app. Analyze this profile photo.

Reject if the image contains:
- Nudity or sexually explicit content
- Violence or gore
- Hate symbols
- Minors (anyone appearing under 18)
- Group photos where the subject is unclear
- Memes, screenshots, or non-photo content
- Drugs or illegal substances

Approve if the image is:
- A clear photo of a person (selfie, portrait, lifestyle)
- Appropriate for a dating app profile

Return JSON only:
{
  "status": "approved" | "rejected",
  "score": 0.0 to 1.0 (confidence of appropriateness, 1.0 = perfectly appropriate),
  "categories": ["category1", ...] (empty if approved),
  "reason": "brief explanation" | null
}`

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64, mimeType } },
      ])

      const text = result.response.text().trim()
      let parsed: PhotoModerationResult

      // Parse JSON from response (handle code fences)
      let raw = text
      if (raw.startsWith('```')) {
        raw = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      }
      parsed = JSON.parse(raw) as PhotoModerationResult

      // Update photo record in database
      await this.db
        .update(photos)
        .set({
          moderationStatus: parsed.status,
          moderationScore: parsed.score,
          moderationCategories:
            parsed.categories.length > 0 ? JSON.stringify(parsed.categories) : null,
          moderatedAt: new Date(),
        })
        .where(eq(photos.id, photoId))

      const latencyMs = Date.now() - startTime
      this.logger.log(
        `Photo moderation: ${latencyMs}ms, status=${parsed.status}, photoId=${photoId}`,
      )

      return parsed
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Photo moderation failed for photoId=${photoId}`, error)

      // Mark as pending on failure — will be retried or manually reviewed
      return {
        status: 'rejected',
        score: 0,
        categories: ['error'],
        reason: 'Moderation service unavailable',
      }
    }
  }
}
