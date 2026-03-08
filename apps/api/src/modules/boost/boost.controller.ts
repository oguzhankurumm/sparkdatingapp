import { Controller } from '@nestjs/common'
import type { BoostService } from './boost.service'

@Controller('boost')
export class BoostController {
  constructor(private readonly boostService: BoostService) {}
}
