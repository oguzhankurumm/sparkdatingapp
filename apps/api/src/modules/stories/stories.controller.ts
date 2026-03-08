import { Controller } from '@nestjs/common'
import type { StoriesService } from './stories.service'

@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}
}
