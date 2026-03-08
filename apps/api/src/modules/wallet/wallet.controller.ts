import { Controller } from '@nestjs/common'
import type { WalletService } from './wallet.service'

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}
}
