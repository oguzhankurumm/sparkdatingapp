import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators'
import type { WalletService } from './wallet.service'

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  /** GET /wallet/me — full wallet overview */
  @Get('me')
  async getWalletData(@CurrentUser('id') userId: string) {
    return this.walletService.getWalletData(userId)
  }

  /** GET /wallet/balance — simple balance check */
  @Get('balance')
  async getBalance(@CurrentUser('id') userId: string) {
    const balance = await this.walletService.getBalance(userId)
    return { balance }
  }

  /** GET /wallet/transactions?page=1&limit=20 — paginated history */
  @Get('transactions')
  async getTransactions(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const clampedLimit = Math.min(Math.max(limit, 1), 50)
    return this.walletService.getTransactions(userId, page, clampedLimit)
  }

  /** GET /wallet/coin-packages — available packages */
  @Get('coin-packages')
  async getCoinPackages() {
    return this.walletService.getCoinPackages()
  }

  /** POST /wallet/purchase — initiate coin purchase */
  @Post('purchase')
  async initiatePurchase(@CurrentUser('id') userId: string, @Body('packageId') packageId: string) {
    return this.walletService.initiatePurchase(userId, packageId)
  }

  /** POST /wallet/withdraw — request token withdrawal */
  @Post('withdraw')
  async requestWithdrawal(
    @CurrentUser('id') userId: string,
    @Body('amount', ParseIntPipe) amount: number,
    @Body('method') method: string,
  ) {
    return this.walletService.requestWithdrawal(userId, amount, method)
  }

  /** POST /wallet/unlock-photos/:targetUserId — unlock user's photos */
  @Post('unlock-photos/:targetUserId')
  async unlockPhotos(
    @CurrentUser('id') viewerId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.walletService.unlockPhotos(viewerId, targetUserId)
  }
}
