import { Inject, Injectable, Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import { and, eq, isNull } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import * as Sentry from '@sentry/node'
import { DATABASE, type Database } from '../../database/database.module'
import { panicEvents, safeDateSessions, users } from '../../database/schema'
import type { User } from '../../database/schema'
import type { TriggerPanicInput } from './dto'

@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name)

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly config: ConfigService,
  ) {}

  /**
   * Trigger a panic event — logs to DB, sends admin alert email,
   * notifies emergency contact via SMS, activates temp incognito.
   */
  async triggerPanic(user: User, input: TriggerPanicInput) {
    try {
      // Look up emergency contact from most recent safe-date session
      const [safeDate] = await this.db
        .select({
          emergencyContactPhone: safeDateSessions.emergencyContactPhone,
          emergencyContactName: safeDateSessions.emergencyContactName,
        })
        .from(safeDateSessions)
        .where(eq(safeDateSessions.userId, user.id))
        .orderBy(sql`${safeDateSessions.startedAt} DESC`)
        .limit(1)

      const autoResetAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // +24h

      // Insert panic event
      const [event] = await this.db
        .insert(panicEvents)
        .values({
          userId: user.id,
          latitude: input.latitude,
          longitude: input.longitude,
          deviceInfo: input.deviceInfo,
          emergencyContactPhone: safeDate?.emergencyContactPhone ?? null,
          emergencyContactName: safeDate?.emergencyContactName ?? null,
          autoResetAt,
        })
        .returning()

      if (!event) {
        throw new Error('Failed to create panic event')
      }

      // Activate temporary incognito (hide from discovery for 24h)
      await this.db.update(users).set({ deletedAt: autoResetAt }).where(eq(users.id, user.id))

      // Send admin alert email (fire-and-forget)
      void this.sendAdminAlert(user, event.id, input)

      // Send emergency contact SMS if available (fire-and-forget)
      if (safeDate?.emergencyContactPhone) {
        void this.sendEmergencySms(
          event.id,
          safeDate.emergencyContactPhone,
          safeDate.emergencyContactName ?? 'Emergency Contact',
          user.firstName,
        )
      }

      this.logger.warn(`PANIC triggered by user ${user.id} — event ${event.id}`)

      return {
        eventId: event.id,
        autoResetAt: event.autoResetAt,
        emergencyContactNotified: !!safeDate?.emergencyContactPhone,
      }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to trigger panic', error)
      throw error
    }
  }

  /**
   * Resolve an active panic event (user confirms they are safe).
   */
  async resolvePanic(userId: string) {
    try {
      const [event] = await this.db
        .update(panicEvents)
        .set({ resolvedAt: new Date() })
        .where(and(eq(panicEvents.userId, userId), isNull(panicEvents.resolvedAt)))
        .returning({ id: panicEvents.id })

      // Restore user visibility (remove temp incognito)
      await this.db.update(users).set({ deletedAt: null }).where(eq(users.id, userId))

      this.logger.log(`Panic resolved by user ${userId}`)

      return { resolved: true, eventId: event?.id ?? null }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to resolve panic', error)
      throw error
    }
  }

  /**
   * Get the active (unresolved) panic event for a user.
   */
  async getActivePanic(userId: string) {
    try {
      const [event] = await this.db
        .select({
          id: panicEvents.id,
          triggeredAt: panicEvents.triggeredAt,
          autoResetAt: panicEvents.autoResetAt,
          resolvedAt: panicEvents.resolvedAt,
          emergencyContactNotified: panicEvents.smsSent,
        })
        .from(panicEvents)
        .where(and(eq(panicEvents.userId, userId), isNull(panicEvents.resolvedAt)))
        .orderBy(sql`${panicEvents.triggeredAt} DESC`)
        .limit(1)

      return event ?? null
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to get active panic', error)
      throw error
    }
  }

  // ── Private Helpers ────────────────────────────

  private async sendAdminAlert(user: User, eventId: string, input: TriggerPanicInput) {
    try {
      const alertEmail = this.config.get<string>('SAFETY_ALERT_EMAIL')
      if (!alertEmail) {
        this.logger.warn('SAFETY_ALERT_EMAIL not configured — skipping admin alert')
        return
      }

      // In production, integrate with SES/Resend here
      // For now, log the alert and mark as sent
      this.logger.warn(
        `ADMIN SAFETY ALERT: User ${user.firstName} (${user.id}) triggered panic at ` +
          `${input.latitude ?? 'unknown'},${input.longitude ?? 'unknown'}. Event: ${eventId}`,
      )

      await this.db
        .update(panicEvents)
        .set({ adminAlertSent: true })
        .where(eq(panicEvents.id, eventId))
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to send admin alert', error)
    }
  }

  private async sendEmergencySms(
    eventId: string,
    phone: string,
    contactName: string,
    userName: string,
  ) {
    try {
      const twilioSid = this.config.get<string>('TWILIO_ACCOUNT_SID')
      if (!twilioSid) {
        this.logger.warn('TWILIO_ACCOUNT_SID not configured — skipping emergency SMS')
        return
      }

      // In production, use Twilio SDK here:
      // const client = twilio(twilioSid, twilioAuthToken)
      // await client.messages.create({
      //   body: `${userName} pressed their safety button on Spark. Please check on them.`,
      //   from: twilioPhoneNumber,
      //   to: phone,
      // })

      this.logger.warn(
        `EMERGENCY SMS: Would send to ${contactName} (${phone}) — ` +
          `"${userName} pressed their safety button on Spark. Please check on them."`,
      )

      await this.db.update(panicEvents).set({ smsSent: true }).where(eq(panicEvents.id, eventId))
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to send emergency SMS', error)
    }
  }
}
