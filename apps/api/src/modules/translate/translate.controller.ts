import { Controller } from '@nestjs/common'
import type { TranslateService } from './translate.service'

@Controller('translate')
export class TranslateController {
  constructor(private readonly translateService: TranslateService) {}
}
