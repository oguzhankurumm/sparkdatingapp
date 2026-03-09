import { Controller, Post, Body, BadRequestException, UseGuards } from '@nestjs/common'
import { PlanGuard } from '../../common/guards/plan.guard'
import { RequiresPlan } from '../../common/decorators/requires-plan.decorator'
import type { TranslateService } from './translate.service'

// Inline DTO — no external file needed for a simple controller
interface TranslateDto {
  text: string
  targetLang: string
  sourceLang?: string
}

interface DetectDto {
  text: string
}

@Controller('translate')
@UseGuards(PlanGuard)
export class TranslateController {
  constructor(private readonly translateService: TranslateService) {}

  /**
   * POST /translate
   * Translate text from one language to another.
   * Premium-only feature.
   */
  @Post()
  @RequiresPlan('premium', 'platinum')
  async translate(@Body() dto: TranslateDto) {
    if (!dto.text?.trim()) {
      throw new BadRequestException('text is required')
    }
    if (!dto.targetLang?.trim()) {
      throw new BadRequestException('targetLang is required')
    }

    return this.translateService.translate(dto.text, dto.targetLang, dto.sourceLang)
  }

  /**
   * POST /translate/detect
   * Detect the language of a text string.
   * Premium-only feature.
   */
  @Post('detect')
  @RequiresPlan('premium', 'platinum')
  async detect(@Body() dto: DetectDto) {
    if (!dto.text?.trim()) {
      throw new BadRequestException('text is required')
    }

    return this.translateService.detectLanguage(dto.text)
  }
}
