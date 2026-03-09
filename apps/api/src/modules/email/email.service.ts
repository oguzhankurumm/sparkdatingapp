import { Injectable, Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'
import * as Sentry from '@sentry/node'
import {
  welcomeEmail,
  matchNotificationEmail,
  matchExpiryWarningEmail,
  referralInviteEmail,
  safetyAlertEmail,
  type WelcomeEmailData,
  type MatchNotificationData,
  type MatchExpiryWarningData,
  type ReferralInviteData,
  type SafetyAlertData,
} from './templates'

const FROM_NOREPLY = 'Spark <noreply@spark.app>'
const FROM_SAFETY = 'Spark Safety <safety@spark.app>'
const ADMIN_EMAIL = 'admin@spark.app'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private readonly resend: Resend

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'))
  }

  // ── Transactional Emails ──────────────────────────────────

  async sendWelcome(to: string, data: WelcomeEmailData): Promise<void> {
    const { subject, html } = welcomeEmail(data)
    await this.send({ to, subject, html, tag: 'welcome' })
  }

  async sendMatchNotification(to: string, data: MatchNotificationData): Promise<void> {
    const { subject, html } = matchNotificationEmail(data)
    await this.send({ to, subject, html, tag: 'match' })
  }

  async sendMatchExpiryWarning(to: string, data: MatchExpiryWarningData): Promise<void> {
    const { subject, html } = matchExpiryWarningEmail(data)
    await this.send({ to, subject, html, tag: 'match-expiry' })
  }

  async sendReferralInvite(to: string, data: ReferralInviteData): Promise<void> {
    const { subject, html } = referralInviteEmail(data)
    await this.send({ to, subject, html, tag: 'referral' })
  }

  async sendSafetyAlert(data: SafetyAlertData): Promise<void> {
    const { subject, html } = safetyAlertEmail(data)
    await this.send({
      to: ADMIN_EMAIL,
      subject,
      html,
      from: FROM_SAFETY,
      tag: 'safety-alert',
    })
  }

  // ── Core Send Method ──────────────────────────────────────

  private async send(params: {
    to: string
    subject: string
    html: string
    from?: string
    tag?: string
  }): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: params.from ?? FROM_NOREPLY,
        to: params.to,
        subject: params.subject,
        html: params.html,
        tags: params.tag ? [{ name: 'category', value: params.tag }] : undefined,
      })

      if (error) {
        this.logger.error(`Resend error: ${error.message}`, { to: params.to, tag: params.tag })
        Sentry.captureException(new Error(`Resend: ${error.message}`), {
          extra: { to: params.to, tag: params.tag },
        })
        return
      }

      this.logger.log(`Email sent: ${data?.id} → ${params.to} [${params.tag ?? 'untagged'}]`)
    } catch (error) {
      Sentry.captureException(error, { extra: { to: params.to, tag: params.tag } })
      this.logger.error(`Failed to send email to ${params.to}`, error)
    }
  }
}
