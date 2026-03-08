import { Inject, Injectable, Logger } from '@nestjs/common'
import { and, eq, sql } from 'drizzle-orm'
import * as Sentry from '@sentry/node'
import { DATABASE, type Database } from '../../database/database.module'
import { tables, users } from '../../database/schema'
import type { User } from '../../database/schema'

export interface NearbyTable {
  id: string
  title: string
  description: string | null
  scheduledAt: Date
  maxGuests: number
  status: 'active' | 'full' | 'completed' | 'cancelled'
  isVip: boolean
  latitude: string | null
  longitude: string | null
  hostFirstName: string
  hostAvatarUrl: string | null
}

@Injectable()
export class TablesService {
  private readonly logger = new Logger(TablesService.name)

  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /**
   * Get active tables near the viewer's location.
   * Uses haversine-approximated bounding box filtering in SQL.
   * Requires the viewer to have latitude/longitude set.
   */
  async getNearbyTables(viewer: User, limit = 30): Promise<{ tables: NearbyTable[] }> {
    try {
      if (!viewer.latitude || !viewer.longitude) {
        return { tables: [] }
      }

      const viewerLat = parseFloat(viewer.latitude)
      const viewerLng = parseFloat(viewer.longitude)
      const maxDistanceKm = viewer.maxDistanceKm

      // Rough bounding box — 1 degree latitude ~ 111 km
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
}
