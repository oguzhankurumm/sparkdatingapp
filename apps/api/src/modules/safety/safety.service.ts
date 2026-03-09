import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common'
import { eq, sql, isNull, and } from 'drizzle-orm'
import * as Sentry from '@sentry/node'
import { DATABASE, type Database } from '../../database/database.module'
import { panicEvents, type PanicEvent } from '../../database/schema'

/** Auto-reset window: 12 hours after trigger */
const AUTO_RESET_HOURS = 12

@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name)

  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /**
   * Get the current active (unresolved + not auto-expired) panic event.
   */
  async getActiveEvent(userId: string): Promise<PanicEvent | null> {
    try {
      const [event] = await this.db
        .select()
        .from(panicEvents)
        .where(and(eq(panicEvents.userId, userId), isNull(panicEvents.resolvedAt)))
        .orderBy(sql`${panicEvents.triggeredAt} DESC`)
        .limit(1)

      if (!event) return null

      // Check if auto-reset time has passed
      if (event.autoResetAt && new Date(event.autoResetAt) < new Date()) {
        // Auto-resolve expired event
        await this.db
          .update(panicEvents)
          .set({ resolvedAt: event.autoResetAt })
          .where(eq(panicEvents.id, event.id))

        return null
      }

      return event
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Error getting active panic event for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * Trigger panic mode:
   * 1. Create panic event record
   * 2. Set user temporarily incognito (profileVisible=false via a flag)
   * 3. TODO: Send SMS to emergency contact (Twilio)
   * 4. TODO: Send admin alert email
   */
  async triggerPanic(
    userId: string,
    input: { latitude?: string; longitude?: string; deviceInfo?: string },
  ): Promise<{ eventId: string; autoResetAt: Date; emergencyContactNotified: boolean }> {
    try {
      // Check if already active
      const existing = await this.getActiveEvent(userId)
      if (existing) {
        return {
          eventId: existing.id,
          autoResetAt: existing.autoResetAt,
          emergencyContactNotified: existing.smsSent,
        }
      }

      const autoResetAt = new Date(Date.now() + AUTO_RESET_HOURS * 60 * 60 * 1000)

      // TODO: Fetch emergency contact from user settings when that table exists
      const emergencyContactName: string | null = null
      const emergencyContactPhone: string | null = null

      const [event] = await this.db
        .insert(panicEvents)
        .values({
          userId,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          deviceInfo: input.deviceInfo ?? null,
          emergencyContactName,
          emergencyContactPhone,
          autoResetAt,
        })
        .returning()

      if (!event) throw new Error('Failed to create panic event')

      // TODO: Twilio SMS to emergency contact
      // TODO: Admin alert email via SES/Resend

      this.logger.warn(`PANIC triggered — userId=${userId}, eventId=${event.id}`)

      return {
        eventId: event.id,
        autoResetAt,
        emergencyContactNotified: false,
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      Sentry.captureException(error)
      this.logger.error(`Error triggering panic for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * Manually resolve (deactivate) panic mode.
   */
  async resolvePanic(userId: string): Promise<{ resolved: boolean; eventId: string }> {
    try {
      const active = await this.getActiveEvent(userId)
      if (!active) {
        throw new BadRequestException('No active panic event to resolve')
      }

      await this.db
        .update(panicEvents)
        .set({ resolvedAt: new Date() })
        .where(eq(panicEvents.id, active.id))

      this.logger.log(`Panic resolved — userId=${userId}, eventId=${active.id}`)

      return { resolved: true, eventId: active.id }
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      Sentry.captureException(error)
      this.logger.error(`Error resolving panic for user: ${userId}`, error)
      throw error
    }
  }
}
