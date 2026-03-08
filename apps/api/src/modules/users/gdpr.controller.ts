import {
  Controller,
  Delete,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common'
import * as Sentry from '@sentry/node'
import type { UsersService } from './users.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

interface ConsentBody {
  type: 'gdpr' | 'kvkk'
}

interface RestoreBody {
  token: string
  email: string
  userId: string
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class GdprController {
  private readonly logger = new Logger(GdprController.name)

  constructor(private readonly usersService: UsersService) {}

  /**
   * DELETE /users/me — Soft delete the authenticated user's account.
   * Anonymizes PII and starts a 30-day grace period.
   */
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@CurrentUser('id') userId: string): Promise<void> {
    try {
      await this.usersService.softDeleteAccount(userId)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error(`Error in deleteAccount for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * POST /users/me/restore — Restore a soft-deleted account within the 30-day grace period.
   * In V1, the user provides their userId, email, and a restore token received via email.
   * Token validation will be handled by auth middleware in production; for now we accept the body.
   */
  @Post('me/restore')
  @HttpCode(HttpStatus.OK)
  async restoreAccount(@Body() body: RestoreBody): Promise<{ message: string }> {
    try {
      // TODO: In production, validate `body.token` against a signed restore token.
      // For V1, we trust the userId + email from the request body.
      await this.usersService.restoreAccount(body.userId, body.email)
      return { message: 'Account restored successfully' }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof Error) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error(`Error in restoreAccount for user: ${body.userId}`, error)
      throw error
    }
  }

  /**
   * POST /users/me/export — Request a data export (GDPR Article 20 / KVKK).
   * V1: Synchronous — collects data and returns JSON directly.
   * Creates a data_export_requests record for audit purposes.
   */
  @Post('me/export')
  @HttpCode(HttpStatus.OK)
  async requestExport(
    @CurrentUser('id') userId: string,
  ): Promise<{ exportId: string; data: object }> {
    try {
      // Create audit record
      const exportId = await this.usersService.createExportRequest(userId)

      // V1: synchronous export
      const data = await this.usersService.exportUserData(userId)

      return { exportId, data }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error(`Error in requestExport for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * GET /users/me/export/:exportId — Check data export status or retrieve download link.
   * V1: Returns the export request status. In V2, this will return S3 presigned URL.
   */
  @Get('me/export/:exportId')
  async getExportStatus(
    @CurrentUser('id') userId: string,
    @Param('exportId') exportId: string,
  ): Promise<{
    id: string
    status: string
    createdAt: Date
    downloadUrl: string | null
    expiresAt: Date | null
  }> {
    try {
      const request = await this.usersService.getExportRequest(exportId, userId)

      if (!request) {
        throw new NotFoundException('Export request not found')
      }

      return request
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error(`Error in getExportStatus for export: ${exportId}, user: ${userId}`, error)
      throw error
    }
  }

  /**
   * POST /users/me/consent — Record GDPR or KVKK consent.
   */
  @Post('me/consent')
  @HttpCode(HttpStatus.OK)
  async recordConsent(
    @CurrentUser('id') userId: string,
    @Body() body: ConsentBody,
  ): Promise<{ message: string }> {
    try {
      if (body.type !== 'gdpr' && body.type !== 'kvkk') {
        throw new Error('Invalid consent type. Must be "gdpr" or "kvkk".')
      }

      await this.usersService.updateConsent(userId, body.type)
      return { message: `${body.type.toUpperCase()} consent recorded` }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error(`Error in recordConsent for user: ${userId}`, error)
      throw error
    }
  }
}
