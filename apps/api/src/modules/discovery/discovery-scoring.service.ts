import { Injectable } from '@nestjs/common'
import { type Gender, DISCOVERY_WEIGHTS } from '@spark/types'
import type { User } from '../../database/schema'

export interface ScoredProfile {
  user: User
  score: number
  breakdown: {
    genderPriority: number
    interests: number
    distance: number
    recency: number
  }
}

@Injectable()
export class DiscoveryScoringService {
  /**
   * Score and rank candidate profiles for a viewer.
   *
   * Formula: gender_priority*0.25 + interests*0.35 + distance*0.20 + recency*0.20
   * - Women get gender_priority = 100, men get 0
   * - Interest overlap: (shared / max(viewer, candidate)) * 100
   * - Distance: inversely proportional (closer = higher score)
   * - Recency: more recently active = higher score
   */
  scoreProfiles(viewer: User, candidates: User[]): ScoredProfile[] {
    const viewerInterests = new Set(viewer.interests ?? [])

    return candidates
      .map((candidate) => {
        const genderPriority = this.calcGenderPriority(candidate.gender)
        const interests = this.calcInterestScore(viewerInterests, candidate.interests ?? [])
        const distance = this.calcDistanceScore(viewer, candidate)
        const recency = this.calcRecencyScore(candidate.lastActiveDate)

        const score =
          genderPriority * DISCOVERY_WEIGHTS.genderPriority +
          interests * DISCOVERY_WEIGHTS.interests +
          distance * DISCOVERY_WEIGHTS.distance +
          recency * DISCOVERY_WEIGHTS.recency

        return {
          user: candidate,
          score,
          breakdown: { genderPriority, interests, distance, recency },
        }
      })
      .sort((a, b) => b.score - a.score)
  }

  /** Women get gender_priority = 100, men = 0 */
  private calcGenderPriority(gender: Gender): number {
    return gender === 'female' || gender === 'non_binary' ? 100 : 0
  }

  /** Jaccard-style interest overlap normalized to 0-100 */
  private calcInterestScore(viewerInterests: Set<string>, candidateInterests: string[]): number {
    if (viewerInterests.size === 0 || candidateInterests.length === 0) return 0
    const shared = candidateInterests.filter((i) => viewerInterests.has(i)).length
    const maxLen = Math.max(viewerInterests.size, candidateInterests.length)
    return (shared / maxLen) * 100
  }

  /** Haversine distance → inverse score (0-100, closer = higher) */
  private calcDistanceScore(viewer: User, candidate: User): number {
    if (!viewer.latitude || !viewer.longitude || !candidate.latitude || !candidate.longitude) {
      return 50 // neutral score when location unknown
    }

    const km = this.haversineKm(
      parseFloat(viewer.latitude),
      parseFloat(viewer.longitude),
      parseFloat(candidate.latitude),
      parseFloat(candidate.longitude),
    )

    // Within 5km = 100, decays to 0 at 200km+
    const maxKm = 200
    return Math.max(0, ((maxKm - Math.min(km, maxKm)) / maxKm) * 100)
  }

  /** Recency: last active within 1 hour = 100, decays over 7 days to 0 */
  private calcRecencyScore(lastActive: Date | null): number {
    if (!lastActive) return 0
    const hoursAgo = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60)
    if (hoursAgo <= 1) return 100
    const maxHours = 7 * 24 // 7 days
    return Math.max(0, ((maxHours - Math.min(hoursAgo, maxHours)) / maxHours) * 100)
  }

  /** Haversine formula for distance between two lat/lng pairs */
  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180
  }
}
