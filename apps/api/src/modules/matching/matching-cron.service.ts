import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import * as Sentry from '@sentry/node'
import type { MatchingService } from './matching.service'
import type { NotificationsService } from '../notifications/notifications.service'
import type { Match } from '../../database/schema'

@Injectable()
export class MatchingCronService {
  private readonly logger = new Logger(MatchingCronService.name)

  constructor(
    private readonly matchingService: MatchingService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Runs every 10 minutes — handles the full match expiry lifecycle:
   * 1. Expire overdue matches → send "match expired" notifications
   * 2. Send 24h ghost reminders (matches expiring within 24h)
   * 3. Send 6h urgent reminders (matches expiring within 6h)
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleMatchExpiry() {
    try {
      // Step 1: Expire overdue matches and notify both users
      const expiredMatches = await this.matchingService.expireStaleMatches()

      for (const match of expiredMatches) {
        await this.sendExpiryNotification(match)
      }

      // Step 2: Send 24h ghost reminders
      const ghostCandidates = await this.matchingService.getGhostReminderCandidates()

      if (ghostCandidates.length > 0) {
        for (const match of ghostCandidates) {
          await this.sendGhostReminder(match)
        }
        const matchIds = ghostCandidates.map((m) => m.id)
        await this.matchingService.markGhostReminderSent(matchIds)
      }

      // Step 3: Send 6h urgent reminders
      const urgentCandidates = await this.matchingService.getUrgentReminderCandidates()

      if (urgentCandidates.length > 0) {
        for (const match of urgentCandidates) {
          await this.sendUrgentReminder(match)
        }
        const matchIds = urgentCandidates.map((m) => m.id)
        await this.matchingService.markUrgentReminderSent(matchIds)
      }

      const total = expiredMatches.length + ghostCandidates.length + urgentCandidates.length
      if (total > 0) {
        this.logger.log(
          `Match cron: expired=${expiredMatches.length}, ` +
            `ghostReminders=${ghostCandidates.length}, ` +
            `urgentReminders=${urgentCandidates.length}`,
        )
      }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Match expiry cron failed', error)
    }
  }

  // ── Notification Helpers ──────────────────────────────

  /**
   * 24h warning: "Your match expires tomorrow! Say hello."
   */
  private async sendGhostReminder(match: Match): Promise<void> {
    const userIds = [match.user1Id, match.user2Id]

    for (const userId of userIds) {
      const partnerId = userId === match.user1Id ? match.user2Id : match.user1Id

      try {
        await this.notificationsService.notify({
          userId,
          type: 'match_expiry',
          title: '⚡ Your match expires tomorrow!',
          body: "Say hello before it's too late.",
          data: { matchId: match.id, stage: '24h' },
          actorId: partnerId,
        })
      } catch (error) {
        Sentry.captureException(error)
        this.logger.error(`Failed to send ghost reminder to ${userId}`, error)
      }
    }
  }

  /**
   * 6h warning: "Last 6 hours! Don't lose your connection."
   */
  private async sendUrgentReminder(match: Match): Promise<void> {
    const userIds = [match.user1Id, match.user2Id]

    for (const userId of userIds) {
      const partnerId = userId === match.user1Id ? match.user2Id : match.user1Id

      try {
        await this.notificationsService.notify({
          userId,
          type: 'match_expiry',
          title: '⏰ Last 6 hours!',
          body: "Don't lose your connection — send a message now.",
          data: { matchId: match.id, stage: '6h' },
          actorId: partnerId,
        })
      } catch (error) {
        Sentry.captureException(error)
        this.logger.error(`Failed to send urgent reminder to ${userId}`, error)
      }
    }
  }

  /**
   * Match expired: "A connection slipped away. Discover new profiles!"
   */
  private async sendExpiryNotification(match: Match): Promise<void> {
    const userIds = [match.user1Id, match.user2Id]

    for (const userId of userIds) {
      const partnerId = userId === match.user1Id ? match.user2Id : match.user1Id

      try {
        await this.notificationsService.notify({
          userId,
          type: 'match_expiry',
          title: '💨 Match expired',
          body: "A connection slipped away! But don't worry — new matches await.",
          data: { matchId: match.id, stage: 'expired', rematchTokens: 50 },
          actorId: partnerId,
        })
      } catch (error) {
        Sentry.captureException(error)
        this.logger.error(`Failed to send expiry notification to ${userId}`, error)
      }
    }
  }
}
