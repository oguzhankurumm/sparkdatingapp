import { Controller } from '@nestjs/common'
import type { DatingHelperService } from './dating-helper.service'

@Controller('dating-helper')
export class DatingHelperController {
  constructor(private readonly datingHelperService: DatingHelperService) {}
}
