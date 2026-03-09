import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import * as Sentry from '@sentry/node'
import type { MatchingService } from './matching.service'

@Injectable()
export class MatchingCronService {
  private readonly logger = new Logger(MatchingCronService.name)

  constructor(private readonly matchingService: MatchingService) {}

  /**
   * Runs every 15 minutes:
   * 1. Expire stale matches (past their 72h window)
   * 2. Find ghost reminder candidates (24h left, not yet notified)
   * 3. Send push notifications and mark as sent
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleMatchExpiry() {
    try {
      // Step 1: Expire overdue matches
      const expiredCount = await this.matchingService.expireStaleMatches()

      // Step 2: Send ghost reminders for matches about to expire
      const candidates = await this.matchingService.getGhostReminderCandidates()

      if (candidates.length > 0) {
        // TODO: Send push notifications via NotificationsService
        // For each candidate, notify both users:
        // "Your match is about to expire! Send a message to keep it alive."
        const matchIds = candidates.map((m) => m.id)
        await this.matchingService.markGhostReminderSent(matchIds)
      }

      if (expiredCount > 0 || candidates.length > 0) {
        this.logger.log(`Match cron: expired=${expiredCount}, ghostReminders=${candidates.length}`)
      }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Match expiry cron failed', error)
    }
  }
}
