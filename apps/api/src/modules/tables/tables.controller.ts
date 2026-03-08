import { Controller, Get } from '@nestjs/common'
import type { TablesService } from './tables.service'
import { CurrentUser } from '../../common/decorators'
import type { User } from '../../database/schema'

@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  /** GET /api/tables/nearby — active tables near the viewer */
  @Get('nearby')
  async getNearbyTables(@CurrentUser() user: User) {
    return this.tablesService.getNearbyTables(user)
  }
}
