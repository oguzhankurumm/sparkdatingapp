import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common'
import type { TablesService } from './tables.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators'
import type { User } from '../../database/schema'
import { createTableSchema } from './dto/create-table.dto'
import { applyToTableSchema } from './dto/apply-to-table.dto'

@Controller('tables')
@UseGuards(JwtAuthGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  /** POST /api/tables — create a new table listing */
  @Post()
  async createTable(@CurrentUser('id') userId: string, @Body() body: unknown) {
    const parsed = createTableSchema.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors)
    }
    return this.tablesService.createTable(userId, parsed.data)
  }

  /** GET /api/tables — browse active tables */
  @Get()
  async browseTables(
    @CurrentUser('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tablesService.browseTables(userId, cursor, limit ? parseInt(limit, 10) : undefined)
  }

  /** GET /api/tables/mine — get the current user's own tables */
  @Get('mine')
  async getMyTables(@CurrentUser('id') userId: string) {
    return this.tablesService.getMyTables(userId)
  }

  /** GET /api/tables/nearby — active tables near the viewer */
  @Get('nearby')
  async getNearbyTables(@CurrentUser() user: User) {
    return this.tablesService.getNearbyTables(user)
  }

  /** GET /api/tables/:id — get a specific table with guests */
  @Get(':id')
  async getTableById(@Param('id') id: string) {
    return this.tablesService.getTableById(id)
  }

  /** POST /api/tables/:id/apply — apply to join a table */
  @Post(':id/apply')
  async applyToTable(
    @Param('id') tableId: string,
    @CurrentUser('id') userId: string,
    @Body() body: unknown,
  ) {
    const parsed = applyToTableSchema.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors)
    }
    return this.tablesService.applyToTable(tableId, userId, parsed.data.message)
  }

  /** PATCH /api/tables/:id/guests/:guestId/accept — host accepts a guest */
  @Patch(':id/guests/:guestId/accept')
  async acceptGuest(
    @Param('id') tableId: string,
    @Param('guestId') guestId: string,
    @CurrentUser('id') hostId: string,
  ) {
    return this.tablesService.acceptGuest(tableId, guestId, hostId)
  }

  /** PATCH /api/tables/:id/guests/:guestId/decline — host declines a guest */
  @Patch(':id/guests/:guestId/decline')
  async declineGuest(
    @Param('id') tableId: string,
    @Param('guestId') guestId: string,
    @CurrentUser('id') hostId: string,
  ) {
    return this.tablesService.declineGuest(tableId, guestId, hostId)
  }

  /** GET /api/tables/:id/applications — get guest applications (host only) */
  @Get(':id/applications')
  async getApplications(@Param('id') tableId: string, @CurrentUser('id') hostId: string) {
    return this.tablesService.getApplications(tableId, hostId)
  }

  /** DELETE /api/tables/:id — host cancels a table */
  @Delete(':id')
  async cancelTable(@Param('id') tableId: string, @CurrentUser('id') hostId: string) {
    return this.tablesService.cancelTable(tableId, hostId)
  }
}
