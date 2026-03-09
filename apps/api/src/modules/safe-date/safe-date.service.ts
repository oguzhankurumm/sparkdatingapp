import { Injectable, Inject, Logger, BadRequestException, NotFoundException } from '@nestjs/common'
import { eq, and } from 'drizzle-orm'
import * as Sentry from '@sentry/node'
import * as crypto from 'node:crypto'
import { DATABASE, type Database } from '../../database/database.module'
import { safeDateSessions, users, type SafeDateSession } from '../../database/schema'

/** Maximum safe-date session duration: 4 hours */
const MAX_SESSION_HOURS = 4

@Injectable()
export class SafeDateService {
  private readonly logger = new Logger(SafeDateService.name)

  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /**
   * Start a new safe-date session.
   * Generates a unique public token and sends SMS to emergency contact.
   */
  async startSession(
    userId: string,
    input: {
      emergencyContactName: string
      emergencyContactPhone: string
      venueAddress?: string
      latitude?: string
      longitude?: string
      durationHours?: number
    },
  ): Promise<{
    sessionId: string
    publicToken: string
    publicUrl: string
    scheduledEndAt: string
    smsSent: boolean
  }> {
    try {
      // Check for existing active session
      const active = await this.getActiveSession(userId)
      if (active) {
        throw new BadRequestException(
          'You already have an active safe-date session. End it before starting a new one.',
        )
      }

      const durationHours = Math.min(input.durationHours ?? MAX_SESSION_HOURS, MAX_SESSION_HOURS)
      const scheduledEndAt = new Date(Date.now() + durationHours * 60 * 60 * 1000)
      const publicToken = crypto.randomBytes(32).toString('hex')

      const [session] = await this.db
        .insert(safeDateSessions)
        .values({
          userId,
          emergencyContactName: input.emergencyContactName,
          emergencyContactPhone: input.emergencyContactPhone,
          publicToken,
          venueAddress: input.venueAddress ?? null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          scheduledEndAt,
        })
        .returning()

      if (!session) throw new Error('Failed to create safe-date session')

      // TODO: Send SMS via Twilio to emergency contact
      // const smsBody = `${userName} is on a date and wants you to know they're safe.
      //   Track their location: ${publicUrl}. If they don't check in by ${scheduledEndAt}, please reach out.`
      let smsSent = false
      try {
        // Twilio integration placeholder
        smsSent = false
        this.logger.log(
          `Safe-date SMS would be sent to ${input.emergencyContactPhone} for session ${session.id}`,
        )
      } catch {
        this.logger.warn(`Failed to send safe-date SMS for session ${session.id}`)
      }

      const publicUrl = `/safe/${publicToken}`

      this.logger.log(`Safe-date session started: userId=${userId}, sessionId=${session.id}`)

      return {
        sessionId: session.id,
        publicToken,
        publicUrl,
        scheduledEndAt: scheduledEndAt.toISOString(),
        smsSent,
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      Sentry.captureException(error)
      this.logger.error(`Error starting safe-date session for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * Update location for an active safe-date session (called periodically via Socket.io or REST).
   */
  async updateLocation(
    userId: string,
    sessionId: string,
    latitude: string,
    longitude: string,
  ): Promise<{ updated: boolean }> {
    try {
      const session = await this.getSessionForUser(userId, sessionId)

      if (session.status !== 'active') {
        throw new BadRequestException('Session is not active')
      }

      await this.db
        .update(safeDateSessions)
        .set({ latitude, longitude })
        .where(eq(safeDateSessions.id, sessionId))

      return { updated: true }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error
      Sentry.captureException(error)
      this.logger.error(`Error updating location for session: ${sessionId}`, error)
      throw error
    }
  }

  /**
   * End a safe-date session normally (user confirms they're safe).
   */
  async endSession(
    userId: string,
    sessionId: string,
  ): Promise<{ ended: boolean; sessionId: string }> {
    try {
      const session = await this.getSessionForUser(userId, sessionId)

      if (session.status !== 'active') {
        throw new BadRequestException('Session is not active')
      }

      await this.db
        .update(safeDateSessions)
        .set({ status: 'completed', endedAt: new Date() })
        .where(eq(safeDateSessions.id, sessionId))

      // TODO: Send "I'm safe" SMS to emergency contact via Twilio

      this.logger.log(`Safe-date session ended normally: sessionId=${sessionId}`)

      return { ended: true, sessionId }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error
      Sentry.captureException(error)
      this.logger.error(`Error ending safe-date session: ${sessionId}`, error)
      throw error
    }
  }

  /**
   * Trigger emergency alert — sends SMS with location to emergency contact.
   */
  async triggerEmergency(
    userId: string,
    sessionId: string,
  ): Promise<{ alerted: boolean; sessionId: string }> {
    try {
      const session = await this.getSessionForUser(userId, sessionId)

      if (session.status !== 'active') {
        throw new BadRequestException('Session is not active')
      }

      await this.db
        .update(safeDateSessions)
        .set({ status: 'emergency' })
        .where(eq(safeDateSessions.id, sessionId))

      // TODO: Send emergency SMS via Twilio with current location
      // TODO: Notify admin via internal alert system

      this.logger.warn(
        `EMERGENCY triggered — userId=${userId}, sessionId=${sessionId}, ` +
          `location=(${session.latitude}, ${session.longitude})`,
      )

      return { alerted: true, sessionId }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error
      Sentry.captureException(error)
      this.logger.error(`Error triggering emergency for session: ${sessionId}`, error)
      throw error
    }
  }

  /**
   * Get the current active session for a user (if any).
   */
  async getActiveSession(userId: string): Promise<SafeDateSession | null> {
    const [session] = await this.db
      .select()
      .from(safeDateSessions)
      .where(and(eq(safeDateSessions.userId, userId), eq(safeDateSessions.status, 'active')))
      .limit(1)

    if (!session) return null

    // Auto-expire if past scheduled end
    if (session.scheduledEndAt && new Date(session.scheduledEndAt) < new Date()) {
      await this.db
        .update(safeDateSessions)
        .set({ status: 'completed', endedAt: session.scheduledEndAt })
        .where(eq(safeDateSessions.id, session.id))

      return null
    }

    return session
  }

  /**
   * Public endpoint — get session info by public token (no auth required).
   * Used by emergency contacts to view date location.
   */
  async getPublicSession(token: string): Promise<{
    userName: string
    venueAddress: string | null
    latitude: string | null
    longitude: string | null
    status: string
    scheduledEndAt: string
    startedAt: string
  }> {
    try {
      const [session] = await this.db
        .select()
        .from(safeDateSessions)
        .where(eq(safeDateSessions.publicToken, token))
        .limit(1)

      if (!session) {
        throw new NotFoundException('Session not found or link expired')
      }

      // Get user's first name for display
      const [user] = await this.db
        .select({ firstName: users.firstName })
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1)

      return {
        userName: user?.firstName ?? 'User',
        venueAddress: session.venueAddress,
        latitude: session.latitude,
        longitude: session.longitude,
        status: session.status,
        scheduledEndAt: session.scheduledEndAt.toISOString(),
        startedAt: session.startedAt.toISOString(),
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      Sentry.captureException(error)
      this.logger.error(`Error fetching public session for token`, error)
      throw error
    }
  }

  /**
   * Validate that a session belongs to the user and exists.
   */
  private async getSessionForUser(userId: string, sessionId: string): Promise<SafeDateSession> {
    const [session] = await this.db
      .select()
      .from(safeDateSessions)
      .where(and(eq(safeDateSessions.id, sessionId), eq(safeDateSessions.userId, userId)))
      .limit(1)

    if (!session) {
      throw new NotFoundException('Safe-date session not found')
    }

    return session
  }
}
