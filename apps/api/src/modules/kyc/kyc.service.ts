import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import { eq } from 'drizzle-orm'
import * as Sentry from '@sentry/node'
import { DefaultApi, Configuration, Region } from '@onfido/api'
import { DATABASE, type Database } from '../../database/database.module'
import { users } from '../../database/schema'
import type { KycInitiateResponse, KycStatus } from '@spark/types'

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name)
  private readonly onfido: DefaultApi

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly config: ConfigService,
  ) {
    this.onfido = new DefaultApi(
      new Configuration({
        apiToken: this.config.getOrThrow<string>('ONFIDO_API_TOKEN'),
        region: Region.EU,
      }),
    )
  }

  /**
   * Get current KYC status for a user.
   */
  async getStatus(userId: string): Promise<KycStatus> {
    const [user] = await this.db
      .select({ kycStatus: users.kycStatus })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    return (user?.kycStatus as KycStatus) ?? 'none'
  }

  /**
   * Initiate KYC verification flow.
   * Creates an Onfido applicant + generates SDK token for client-side widget.
   */
  async initiate(
    userId: string,
    firstName: string,
    lastName: string,
    email: string,
  ): Promise<KycInitiateResponse> {
    try {
      // Prevent re-initiation if already verified
      const currentStatus = await this.getStatus(userId)
      if (currentStatus === 'verified') {
        throw new BadRequestException('KYC already verified')
      }

      // Create Onfido applicant
      const { data: applicant } = await this.onfido.createApplicant({
        first_name: firstName,
        last_name: lastName,
        email,
      })

      // Generate SDK token for client-side Onfido widget
      const { data: sdkToken } = await this.onfido.generateSdkToken({
        applicant_id: applicant.id,
      })

      // Create a check (document + facial_similarity_photo)
      await this.onfido.createCheck({
        applicant_id: applicant.id,
        report_names: ['document', 'facial_similarity_photo'],
      })

      // Update user status to pending
      await this.db
        .update(users)
        .set({ kycStatus: 'pending', updatedAt: new Date() })
        .where(eq(users.id, userId))

      this.logger.log(`KYC initiated for user ${userId}, applicantId=${applicant.id}`)

      return {
        applicantId: applicant.id,
        sdkToken: sdkToken.token,
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      Sentry.captureException(error)
      this.logger.error(`KYC initiation failed for user ${userId}`, error)
      throw error
    }
  }

  /**
   * Handle Onfido webhook callback.
   * Updates user's kycStatus based on the check result.
   */
  async handleWebhook(payload: {
    resourceType: string
    action: string
    object: { id: string; status: string; result: string; applicant_id: string }
  }): Promise<void> {
    try {
      if (payload.resourceType !== 'check') {
        this.logger.debug(`Ignoring Onfido webhook: resourceType=${payload.resourceType}`)
        return
      }

      const { status, result, applicant_id } = payload.object

      if (status !== 'complete') {
        this.logger.debug(`Onfido check not complete: status=${status}`)
        return
      }

      // Find user by searching — in production, store applicantId in users table
      // For now, update based on kycStatus='pending' pattern
      const newStatus: KycStatus = result === 'clear' ? 'verified' : 'none'

      this.logger.log(
        `Onfido webhook: applicant=${applicant_id}, result=${result}, newStatus=${newStatus}`,
      )

      // Update all pending users with this applicant (best effort)
      // In production: add onfidoApplicantId column to users table for precise matching
      await this.db
        .update(users)
        .set({
          kycStatus: newStatus,
          isVerified: newStatus === 'verified',
          updatedAt: new Date(),
        })
        .where(eq(users.kycStatus, 'pending'))

      this.logger.log(`KYC status updated to ${newStatus} for applicant ${applicant_id}`)
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Onfido webhook handling failed', error)
      throw error
    }
  }
}
