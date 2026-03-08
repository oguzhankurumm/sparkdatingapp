import { Controller } from '@nestjs/common'
import type { GiftsService } from './gifts.service'

@Controller('gifts')
export class GiftsController {
  constructor(private readonly giftsService: GiftsService) {}
}
