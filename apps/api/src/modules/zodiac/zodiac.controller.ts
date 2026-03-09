import { Controller, Get, Param } from '@nestjs/common'
import type { ZodiacService } from './zodiac.service'
import type { ZodiacSign } from './zodiac.service'

@Controller('zodiac')
export class ZodiacController {
  constructor(private readonly zodiacService: ZodiacService) {}

  /** Get zodiac info for a given sign */
  @Get('signs/:sign')
  getSignInfo(@Param('sign') sign: ZodiacSign) {
    return this.zodiacService.getSignInfo(sign)
  }

  /** Get compatibility between two signs */
  @Get('compatibility/:signA/:signB')
  getCompatibility(@Param('signA') signA: ZodiacSign, @Param('signB') signB: ZodiacSign) {
    return this.zodiacService.getCompatibility(signA, signB)
  }

  /** Calculate zodiac sign from a birthday string (YYYY-MM-DD) */
  @Get('calculate/:birthday')
  calculateSign(@Param('birthday') birthday: string) {
    const sign = this.zodiacService.getSignFromBirthday(birthday)
    return this.zodiacService.getSignInfo(sign)
  }
}
