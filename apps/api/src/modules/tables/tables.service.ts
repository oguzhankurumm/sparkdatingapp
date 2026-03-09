import {
  Inject,
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { and, eq, sql, desc, ne } from 'drizzle-orm'
import * as Sentry from '@sentry/node'
import { DATABASE, type Database } from '../../database/database.module'
import { tables, tableGuests, users } from '../../database/schema'
import type { User } from '../../database/schema'
import type { WalletService } from '../wallet/wallet.service'
import type { MatchingService } from '../matching/matching.service'
import type { PlanFeaturesService } from '../subscriptions/plan-features.service'
import { TABLE_LIMITS, TOKEN_ECONOMY } from '@spark/types'
import type { CreateTableInput } from './dto/create-table.dto'

@Injectable()
export class TablesService {
  private readonly logger = new Logger(TablesService.name)

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly walletService: WalletService,
    private readonly matchingService: MatchingService,
    private readonly planFeaturesService: PlanFeaturesService,
  ) {}

  /**
   * Create a new table listing.
   * Deducts tokens (100 normal, 500 VIP) and enforces plan-based active table limits.
   */
  async createTable(userId: string, input: CreateTableInput) {
    try {
      // Look up the user's subscription plan from the subscriptions table
      const userPlan = await this.planFeaturesService.getUserPlan(userId)

      // Enforce active table limit per plan
      const limits = TABLE_LIMITS[userPlan]
      const [countRow] = await this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(tables)
        .where(and(eq(tables.hostId, userId), eq(tables.status, 'active')))

      if ((countRow?.count ?? 0) >= limits.maxActiveTables) {
        throw new BadRequestException(
          `You can have at most ${limits.maxActiveTables} active table(s) on your plan.`,
        )
      }

      const cost = input.isVip
        ? TOKEN_ECONOMY.VIP_TABLE_CREATE_COST
        : TOKEN_ECONOMY.TABLE_CREATE_COST
      const maxGuests = input.isVip
        ? Math.min(input.maxGuests, TOKEN_ECONOMY.TABLE_MAX_GUESTS_VIP)
        : Math.min(input.maxGuests, TOKEN_ECONOMY.TABLE_MAX_GUESTS_NORMAL)

      // Deduct tokens first (atomic, throws on insufficient balance)
      await this.walletService.deductTokens(
        userId,
        cost,
        'table_create',
        `Created ${input.isVip ? 'VIP ' : ''}table: ${input.title}`,
      )

      // Insert table
      const [table] = await this.db
        .insert(tables)
        .values({
          hostId: userId,
          title: input.title,
          description: input.description ?? null,
          venueName: input.venueName ?? null,
          venueAddress: input.venueAddress ?? null,
          customLocation: input.customLocation ?? null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          scheduledAt: new Date(input.scheduledAt),
          maxGuests,
          isVip: input.isVip,
          tokenCostToCreate: cost,
          tokenCostToJoin: TOKEN_ECONOMY.TABLE_JOIN_COST,
        })
        .returning()

      if (!table) throw new Error('Failed to insert table')
      return table
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      Sentry.captureException(error)
      this.logger.error(`Error creating table for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * Get a single table with host info and guest list.
   */
  async getTableById(tableId: string) {
    try {
      const [table] = await this.db
        .select({
          id: tables.id,
          hostId: tables.hostId,
          title: tables.title,
          description: tables.description,
          venueName: tables.venueName,
          venueAddress: tables.venueAddress,
          customLocation: tables.customLocation,
          latitude: tables.latitude,
          longitude: tables.longitude,
          scheduledAt: tables.scheduledAt,
          maxGuests: tables.maxGuests,
          status: tables.status,
          isVip: tables.isVip,
          tokenCostToJoin: tables.tokenCostToJoin,
          createdAt: tables.createdAt,
          hostFirstName: users.firstName,
          hostAvatarUrl: users.avatarUrl,
          hostIsVerified: users.isVerified,
        })
        .from(tables)
        .innerJoin(users, eq(tables.hostId, users.id))
        .where(eq(tables.id, tableId))
        .limit(1)

      if (!table) throw new NotFoundException('Table not found')

      // Get guests
      const guests = await this.db
        .select({
          id: tableGuests.id,
          userId: tableGuests.userId,
          status: tableGuests.status,
          message: tableGuests.message,
          createdAt: tableGuests.createdAt,
          firstName: users.firstName,
          avatarUrl: users.avatarUrl,
          isVerified: users.isVerified,
        })
        .from(tableGuests)
        .innerJoin(users, eq(tableGuests.userId, users.id))
        .where(eq(tableGuests.tableId, tableId))
        .orderBy(desc(tableGuests.createdAt))

      return { ...table, guests }
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      Sentry.captureException(error)
      this.logger.error(`Error getting table: ${tableId}`, error)
      throw error
    }
  }

  /**
   * Browse active tables — excludes the viewer's own tables.
   * Cursor-based pagination using createdAt.
   */
  async browseTables(viewerId: string, cursor?: string, limit = 20) {
    try {
      const conditions = [
        eq(tables.status, 'active'),
        ne(tables.hostId, viewerId),
        sql`${tables.scheduledAt} > NOW()`,
      ]
      if (cursor) {
        conditions.push(sql`${tables.createdAt} < ${cursor}`)
      }

      const rows = await this.db
        .select({
          id: tables.id,
          title: tables.title,
          description: tables.description,
          venueName: tables.venueName,
          venueAddress: tables.venueAddress,
          customLocation: tables.customLocation,
          scheduledAt: tables.scheduledAt,
          maxGuests: tables.maxGuests,
          status: tables.status,
          isVip: tables.isVip,
          tokenCostToJoin: tables.tokenCostToJoin,
          createdAt: tables.createdAt,
          hostFirstName: users.firstName,
          hostAvatarUrl: users.avatarUrl,
          hostIsVerified: users.isVerified,
        })
        .from(tables)
        .innerJoin(users, eq(tables.hostId, users.id))
        .where(and(...conditions))
        .orderBy(desc(tables.createdAt))
        .limit(limit + 1)

      const hasMore = rows.length > limit
      const items = hasMore ? rows.slice(0, limit) : rows
      const nextCursor = hasMore ? items[items.length - 1]?.createdAt?.toISOString() : null

      return { tables: items, nextCursor }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Error browsing tables', error)
      throw error
    }
  }

  /**
   * Get the current user's own tables (as host).
   */
  async getMyTables(userId: string) {
    try {
      const rows = await this.db
        .select({
          id: tables.id,
          title: tables.title,
          description: tables.description,
          venueName: tables.venueName,
          scheduledAt: tables.scheduledAt,
          maxGuests: tables.maxGuests,
          status: tables.status,
          isVip: tables.isVip,
          createdAt: tables.createdAt,
          guestCount: sql<number>`(
            SELECT count(*)::int FROM table_guests
            WHERE table_guests.table_id = ${tables.id}
            AND table_guests.status = 'accepted'
          )`,
          pendingCount: sql<number>`(
            SELECT count(*)::int FROM table_guests
            WHERE table_guests.table_id = ${tables.id}
            AND table_guests.status = 'pending'
          )`,
        })
        .from(tables)
        .where(eq(tables.hostId, userId))
        .orderBy(desc(tables.createdAt))

      return { tables: rows }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Error getting tables for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * Apply to join a table as a guest.
   * Deducts TABLE_JOIN_COST tokens, creates a pending guest record.
   */
  async applyToTable(tableId: string, userId: string, message?: string) {
    try {
      const [table] = await this.db.select().from(tables).where(eq(tables.id, tableId)).limit(1)

      if (!table) throw new NotFoundException('Table not found')
      if (table.status !== 'active') {
        throw new BadRequestException('This table is no longer accepting guests.')
      }
      if (table.hostId === userId) {
        throw new BadRequestException('You cannot apply to your own table.')
      }

      // Check if already applied
      const [existing] = await this.db
        .select()
        .from(tableGuests)
        .where(and(eq(tableGuests.tableId, tableId), eq(tableGuests.userId, userId)))
        .limit(1)

      if (existing) {
        throw new BadRequestException('You have already applied to this table.')
      }

      // Check if table is full (accepted guests >= maxGuests)
      const countResult = await this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(tableGuests)
        .where(and(eq(tableGuests.tableId, tableId), eq(tableGuests.status, 'accepted')))

      if ((countResult[0]?.count ?? 0) >= table.maxGuests) {
        throw new BadRequestException('This table is full.')
      }

      // Deduct join tokens
      const joinCost = TOKEN_ECONOMY.TABLE_JOIN_COST
      await this.walletService.deductTokens(
        userId,
        joinCost,
        'table_join',
        `Applied to table: ${table.title}`,
        tableId,
        'table',
      )

      // Create guest application
      const [guest] = await this.db
        .insert(tableGuests)
        .values({
          tableId,
          userId,
          message: message ?? null,
          tokensCharged: joinCost,
        })
        .returning()

      return guest
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error
      Sentry.captureException(error)
      this.logger.error(`Error applying to table: ${tableId}`, error)
      throw error
    }
  }

  /**
   * Host accepts a guest application.
   * Also auto-creates a match between host and guest.
   */
  async acceptGuest(tableId: string, guestId: string, hostId: string) {
    try {
      const table = await this.validateHostOwnership(tableId, hostId)

      const [guest] = await this.db
        .select()
        .from(tableGuests)
        .where(and(eq(tableGuests.id, guestId), eq(tableGuests.tableId, tableId)))
        .limit(1)

      if (!guest) throw new NotFoundException('Guest application not found')
      if (guest.status !== 'pending') {
        throw new BadRequestException('This application has already been processed.')
      }

      // Accept the guest
      await this.db
        .update(tableGuests)
        .set({ status: 'accepted', respondedAt: new Date() })
        .where(eq(tableGuests.id, guestId))

      // Check if table is now full
      const fullCountResult = await this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(tableGuests)
        .where(and(eq(tableGuests.tableId, tableId), eq(tableGuests.status, 'accepted')))

      if ((fullCountResult[0]?.count ?? 0) >= table.maxGuests) {
        await this.db
          .update(tables)
          .set({ status: 'full', updatedAt: new Date() })
          .where(eq(tables.id, tableId))
      }

      // Auto-create match between host and guest
      try {
        await this.matchingService.createMatchFromLike(hostId, guest.userId)
        this.logger.log(`Auto-match created: host=${hostId}, guest=${guest.userId}`)
      } catch {
        // Match may already exist — not critical
        this.logger.warn(
          `Could not auto-create match for table guest: host=${hostId}, guest=${guest.userId}`,
        )
      }

      return { accepted: true }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error
      Sentry.captureException(error)
      this.logger.error(`Error accepting guest: ${guestId}`, error)
      throw error
    }
  }

  /**
   * Host declines a guest application.
   */
  async declineGuest(tableId: string, guestId: string, hostId: string) {
    try {
      await this.validateHostOwnership(tableId, hostId)

      const [guest] = await this.db
        .select()
        .from(tableGuests)
        .where(and(eq(tableGuests.id, guestId), eq(tableGuests.tableId, tableId)))
        .limit(1)

      if (!guest) throw new NotFoundException('Guest application not found')
      if (guest.status !== 'pending') {
        throw new BadRequestException('This application has already been processed.')
      }

      await this.db
        .update(tableGuests)
        .set({ status: 'declined', respondedAt: new Date() })
        .where(eq(tableGuests.id, guestId))

      return { declined: true }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error
      Sentry.captureException(error)
      this.logger.error(`Error declining guest: ${guestId}`, error)
      throw error
    }
  }

  /**
   * Host cancels their table.
   */
  async cancelTable(tableId: string, hostId: string) {
    try {
      await this.validateHostOwnership(tableId, hostId)

      await this.db
        .update(tables)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(tables.id, tableId))

      return { cancelled: true }
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException) throw error
      Sentry.captureException(error)
      this.logger.error(`Error cancelling table: ${tableId}`, error)
      throw error
    }
  }

  /**
   * Get all applications for a table (host only).
   */
  async getApplications(tableId: string, hostId: string) {
    try {
      await this.validateHostOwnership(tableId, hostId)

      const guests = await this.db
        .select({
          id: tableGuests.id,
          userId: tableGuests.userId,
          status: tableGuests.status,
          message: tableGuests.message,
          createdAt: tableGuests.createdAt,
          firstName: users.firstName,
          avatarUrl: users.avatarUrl,
          isVerified: users.isVerified,
        })
        .from(tableGuests)
        .innerJoin(users, eq(tableGuests.userId, users.id))
        .where(eq(tableGuests.tableId, tableId))
        .orderBy(desc(tableGuests.createdAt))

      return { guests }
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException) throw error
      Sentry.captureException(error)
      this.logger.error(`Error getting applications for table: ${tableId}`, error)
      throw error
    }
  }

  /**
   * Get active tables near the viewer's location.
   * Uses haversine-approximated bounding box filtering in SQL.
   */
  async getNearbyTables(viewer: User, limit = 30) {
    try {
      if (!viewer.latitude || !viewer.longitude) {
        return { tables: [] }
      }

      const viewerLat = parseFloat(viewer.latitude)
      const viewerLng = parseFloat(viewer.longitude)
      const maxDistanceKm = viewer.maxDistanceKm

      const latDelta = maxDistanceKm / 111.0
      const lngDelta = maxDistanceKm / (111.0 * Math.cos((viewerLat * Math.PI) / 180))

      const minLat = viewerLat - latDelta
      const maxLat = viewerLat + latDelta
      const minLng = viewerLng - lngDelta
      const maxLng = viewerLng + lngDelta

      const haversineDistance = sql<number>`
        6371 * acos(
          LEAST(1.0, cos(radians(${viewerLat}))
          * cos(radians(CAST(${tables.latitude} AS double precision)))
          * cos(radians(CAST(${tables.longitude} AS double precision)) - radians(${viewerLng}))
          + sin(radians(${viewerLat}))
          * sin(radians(CAST(${tables.latitude} AS double precision))))
        )
      `

      const rows = await this.db
        .select({
          id: tables.id,
          title: tables.title,
          description: tables.description,
          scheduledAt: tables.scheduledAt,
          maxGuests: tables.maxGuests,
          status: tables.status,
          isVip: tables.isVip,
          latitude: tables.latitude,
          longitude: tables.longitude,
          hostFirstName: users.firstName,
          hostAvatarUrl: users.avatarUrl,
        })
        .from(tables)
        .innerJoin(users, eq(tables.hostId, users.id))
        .where(
          and(
            eq(tables.status, 'active'),
            sql`${tables.latitude} IS NOT NULL`,
            sql`${tables.longitude} IS NOT NULL`,
            sql`CAST(${tables.latitude} AS double precision) BETWEEN ${minLat} AND ${maxLat}`,
            sql`CAST(${tables.longitude} AS double precision) BETWEEN ${minLng} AND ${maxLng}`,
            sql`${haversineDistance} <= ${maxDistanceKm}`,
          ),
        )
        .orderBy(haversineDistance)
        .limit(limit)

      return { tables: rows }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to get nearby tables', error)
      throw error
    }
  }

  /**
   * Validate that the caller is the host of the table.
   */
  private async validateHostOwnership(tableId: string, hostId: string) {
    const [table] = await this.db.select().from(tables).where(eq(tables.id, tableId)).limit(1)

    if (!table) throw new NotFoundException('Table not found')
    if (table.hostId !== hostId) {
      throw new ForbiddenException('Only the host can manage this table.')
    }
    return table
  }
}
