import { Controller } from '@nestjs/common'
import type { ZodiacService } from './zodiac.service'

@Controller('zodiac')
export class ZodiacController {
  constructor(private readonly zodiacService: ZodiacService) {}
}
