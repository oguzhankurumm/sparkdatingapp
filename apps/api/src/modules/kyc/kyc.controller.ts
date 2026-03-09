import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators'
import { Public } from '../../common/decorators/public.decorator'
import type { KycService } from './kyc.service'
import type { User } from '../../database/schema'

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  /**
   * GET /kyc/status
   * Returns the current user's KYC verification status.
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@CurrentUser('id') userId: string) {
    const status = await this.kycService.getStatus(userId)
    return { status }
  }

  /**
   * POST /kyc/initiate
   * Initiates KYC verification via Onfido.
   * Returns an SDK token for the client-side Onfido widget.
   */
  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async initiate(@CurrentUser() user: User, @Body() body: { lastName: string }) {
    return this.kycService.initiate(user.id, user.firstName, body.lastName, user.email ?? '')
  }

  /**
   * POST /kyc/webhook
   * Public endpoint for Onfido webhook callbacks.
   * Onfido sends check results here after verification completes.
   */
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(@Body() payload: Record<string, unknown>) {
    await this.kycService.handleWebhook(
      payload as {
        resourceType: string
        action: string
        object: { id: string; status: string; result: string; applicant_id: string }
      },
    )
    return { received: true }
  }
}
