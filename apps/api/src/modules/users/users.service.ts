import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import { eq, and, isNull, or, lt, sql } from 'drizzle-orm'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import * as Sentry from '@sentry/node'
import { DATABASE, type Database } from '../../database/database.module'
import {
  users,
  photos,
  userSessions,
  matches,
  messages,
  likes,
  wallets,
  walletTransactions,
  sentGifts,
  dataExportRequests,
  type User,
  type NewUser,
} from '../../database/schema'

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)
  private readonly s3: S3Client
  private readonly bucket: string
  private readonly cdnBaseUrl: string

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly configService: ConfigService,
  ) {
    this.s3 = new S3Client({
      region: this.configService.getOrThrow<string>('AWS_REGION'),
    })
    this.bucket = this.configService.getOrThrow<string>('AWS_S3_BUCKET')
    this.cdnBaseUrl = this.configService.getOrThrow<string>('CDN_BASE_URL')
  }

  /**
   * Find a user by their UUID. Excludes soft-deleted users.
   */
  async findById(id: string): Promise<User | null> {
    try {
      const [user] = await this.db
        .select()
        .from(users)
        .where(and(eq(users.id, id), isNull(users.deletedAt)))
        .limit(1)

      return user ?? null
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Error finding user by id: ${id}`, error)
      throw error
    }
  }

  /**
   * Find a user by email. Excludes soft-deleted users.
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const [user] = await this.db
        .select()
        .from(users)
        .where(and(eq(users.email, email), isNull(users.deletedAt)))
        .limit(1)

      return user ?? null
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Error finding user by email: ${email}`, error)
      throw error
    }
  }

  /**
   * Find a user by Google ID. Does not filter by deletedAt since
   * we may want to re-link accounts.
   */
  async findByGoogleId(googleId: string): Promise<User | null> {
    try {
      const [user] = await this.db.select().from(users).where(eq(users.googleId, googleId)).limit(1)

      return user ?? null
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Error finding user by googleId: ${googleId}`, error)
      throw error
    }
  }

  /**
   * Create a new user.
   */
  async create(data: NewUser): Promise<User> {
    try {
      const [user] = await this.db.insert(users).values(data).returning()

      if (!user) {
        throw new Error('Failed to create user')
      }

      return user
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Error creating user', error)
      throw error
    }
  }

  /**
   * Update a user's profile fields. Sets updatedAt automatically.
   */
  async updateProfile(
    userId: string,
    data: Partial<
      Pick<
        User,
        | 'firstName'
        | 'bio'
        | 'avatarUrl'
        | 'voiceNoteUrl'
        | 'voiceNoteDuration'
        | 'videoProfileUrl'
        | 'videoProfileThumbnailUrl'
        | 'interests'
        | 'latitude'
        | 'longitude'
        | 'city'
        | 'country'
        | 'relationshipGoal'
        | 'showMe'
        | 'ageRangeMin'
        | 'ageRangeMax'
        | 'maxDistanceKm'
        | 'showGender'
        | 'isPhotosPrivate'
      >
    >,
  ): Promise<User> {
    try {
      const [updated] = await this.db
        .update(users)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(and(eq(users.id, userId), isNull(users.deletedAt)))
        .returning()

      if (!updated) {
        throw new NotFoundException('User not found')
      }

      return updated
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error(`Error updating profile for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * Update onboarding step data. Used during the 9-step onboarding wizard.
   * Accepts partial user data relevant to the given step.
   */
  async updateOnboarding(userId: string, step: number, data: Partial<NewUser>): Promise<User> {
    try {
      // Remove fields that should never be set via onboarding
      const {
        id: _id,
        role: _role,
        isBanned: _isBanned,
        deletedAt: _deletedAt,
        createdAt: _createdAt,
        passwordHash: _passwordHash,
        googleId: _googleId,
        appleId: _appleId,
        ...safeData
      } = data

      const [updated] = await this.db
        .update(users)
        .set({
          ...safeData,
          updatedAt: new Date(),
        })
        .where(and(eq(users.id, userId), isNull(users.deletedAt)))
        .returning()

      if (!updated) {
        throw new NotFoundException('User not found')
      }

      return updated
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error(`Error updating onboarding step ${step} for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * Get a full profile with photos joined.
   */
  async getProfile(userId: string): Promise<{
    user: Omit<User, 'passwordHash'>
    photos: Array<{ id: string; url: string; position: number }>
  } | null> {
    try {
      const [user] = await this.db
        .select()
        .from(users)
        .where(and(eq(users.id, userId), isNull(users.deletedAt)))
        .limit(1)

      if (!user) {
        return null
      }

      const userPhotos = await this.db
        .select({
          id: photos.id,
          url: photos.url,
          position: photos.position,
        })
        .from(photos)
        .where(eq(photos.userId, userId))
        .orderBy(photos.position)

      const { passwordHash: _, ...userWithoutPassword } = user
      return { user: userWithoutPassword, photos: userPhotos }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Error getting profile for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * Soft-delete a user by setting deletedAt.
   */
  async softDelete(userId: string): Promise<void> {
    try {
      const [updated] = await this.db
        .update(users)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(users.id, userId), isNull(users.deletedAt)))
        .returning()

      if (!updated) {
        throw new NotFoundException('User not found')
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error(`Error soft-deleting user: ${userId}`, error)
      throw error
    }
  }

  // ─── GDPR / KVKK Compliance Methods ───────────────────────────────────

  /**
   * Soft delete account — anonymizes PII, revokes sessions.
   * 30-day grace period before hard delete (cron).
   */
  async softDeleteAccount(userId: string): Promise<void> {
    try {
      await this.db.transaction(async (tx) => {
        // 1. Anonymize PII
        const [updated] = await tx
          .update(users)
          .set({
            email: `deleted_${userId}@spark.deleted`,
            firstName: 'Deleted User',
            phone: null,
            bio: null,
            avatarUrl: null,
            voiceNoteUrl: null,
            videoProfileUrl: null,
            videoProfileThumbnailUrl: null,
            interests: null,
            latitude: null,
            longitude: null,
            city: null,
            country: null,
            googleId: null,
            appleId: null,
            passwordHash: null,
            isBanned: false,
            banReason: null,
            deletedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(and(eq(users.id, userId), isNull(users.deletedAt)))
          .returning()

        if (!updated) {
          throw new NotFoundException('User not found')
        }

        // 2. Delete all sessions
        await tx.delete(userSessions).where(eq(userSessions.userId, userId))
      })

      this.logger.log(`Account soft-deleted and PII anonymized for user: ${userId}`)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error(`Error soft-deleting account for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * Hard delete — called by cron 30 days after soft delete.
   * Removes user data but keeps financial records (wallet transactions) for 5 years per regulations.
   * Returns count of deleted users.
   */
  async hardDeleteExpiredAccounts(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Find users whose deletedAt is more than 30 days ago
      const expiredUsers = await this.db
        .select({ id: users.id })
        .from(users)
        .where(and(lt(users.deletedAt, thirtyDaysAgo), sql`${users.deletedAt} IS NOT NULL`))

      if (expiredUsers.length === 0) {
        return 0
      }

      let deletedCount = 0

      for (const expiredUser of expiredUsers) {
        try {
          await this.db.transaction(async (tx) => {
            const uid = expiredUser.id

            // Delete messages (via matches cascade or directly)
            await tx.delete(messages).where(eq(messages.senderId, uid))

            // Delete matches
            await tx.delete(matches).where(or(eq(matches.user1Id, uid), eq(matches.user2Id, uid)))

            // Delete likes
            await tx.delete(likes).where(or(eq(likes.senderId, uid), eq(likes.receiverId, uid)))

            // Delete photos (DB records — S3 cleanup is a separate job)
            await tx.delete(photos).where(eq(photos.userId, uid))

            // Delete sent gifts records (but wallet transactions are kept for financial compliance)
            await tx
              .delete(sentGifts)
              .where(or(eq(sentGifts.senderId, uid), eq(sentGifts.receiverId, uid)))

            // Delete data export requests
            await tx.delete(dataExportRequests).where(eq(dataExportRequests.userId, uid))

            // NOTE: walletTransactions are NOT deleted — 5-year legal requirement
            // Delete wallet (but transactions remain orphaned intentionally for audit)
            await tx.delete(wallets).where(eq(wallets.userId, uid))

            // Finally delete the user record
            await tx.delete(users).where(eq(users.id, uid))
          })

          deletedCount++
        } catch (userError) {
          Sentry.captureException(userError)
          this.logger.error(`Error hard-deleting user: ${expiredUser.id}`, userError)
          // Continue with next user — don't let one failure stop the batch
        }
      }

      this.logger.log(`Hard-deleted ${deletedCount} expired accounts`)
      return deletedCount
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Error in hardDeleteExpiredAccounts', error)
      throw error
    }
  }

  /**
   * Restore account — within 30-day grace period.
   * Clears deletedAt and restores the email.
   */
  async restoreAccount(userId: string, email: string): Promise<void> {
    try {
      const [user] = await this.db
        .select()
        .from(users)
        .where(and(eq(users.id, userId), sql`${users.deletedAt} IS NOT NULL`))
        .limit(1)

      if (!user) {
        throw new NotFoundException('Deleted account not found')
      }

      // Check grace period: deletedAt must be within the last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      if (user.deletedAt && user.deletedAt < thirtyDaysAgo) {
        throw new BadRequestException('Grace period expired. Account cannot be restored.')
      }

      // Check email availability
      const [existingUser] = await this.db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, email), isNull(users.deletedAt)))
        .limit(1)

      if (existingUser) {
        throw new ConflictException('Email is already in use by another account')
      }

      await this.db
        .update(users)
        .set({
          deletedAt: null,
          email,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))

      this.logger.log(`Account restored for user: ${userId}`)
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error(`Error restoring account for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * Export user data — collect all user data into a JSON structure.
   * V1: synchronous, returns JSON directly.
   */
  async exportUserData(userId: string): Promise<object> {
    try {
      // Profile
      const [user] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1)

      if (!user) {
        throw new NotFoundException('User not found')
      }

      const { passwordHash: _, ...profileData } = user

      // Photos
      const userPhotos = await this.db
        .select({
          id: photos.id,
          url: photos.url,
          position: photos.position,
          createdAt: photos.createdAt,
        })
        .from(photos)
        .where(eq(photos.userId, userId))

      // Matches
      const userMatches = await this.db
        .select()
        .from(matches)
        .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)))

      // Messages
      const userMessages = await this.db
        .select({
          id: messages.id,
          matchId: messages.matchId,
          type: messages.type,
          content: messages.content,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(eq(messages.senderId, userId))

      // Wallet & Transactions
      const [wallet] = await this.db
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId))
        .limit(1)

      let transactions: Array<{
        id: string
        type: string
        amount: number
        balanceAfter: number
        description: string | null
        createdAt: Date
      }> = []

      if (wallet) {
        transactions = await this.db
          .select({
            id: walletTransactions.id,
            type: walletTransactions.type,
            amount: walletTransactions.amount,
            balanceAfter: walletTransactions.balanceAfter,
            description: walletTransactions.description,
            createdAt: walletTransactions.createdAt,
          })
          .from(walletTransactions)
          .where(eq(walletTransactions.walletId, wallet.id))
      }

      // Sent Gifts
      const gifts = await this.db
        .select({
          id: sentGifts.id,
          receiverId: sentGifts.receiverId,
          giftTypeId: sentGifts.giftTypeId,
          context: sentGifts.context,
          tokensCost: sentGifts.tokensCost,
          createdAt: sentGifts.createdAt,
        })
        .from(sentGifts)
        .where(eq(sentGifts.senderId, userId))

      return {
        exportedAt: new Date().toISOString(),
        userId,
        profile: profileData,
        photos: userPhotos,
        matches: userMatches,
        messagesSent: userMessages,
        wallet: wallet
          ? {
              balance: wallet.balance,
              totalEarned: wallet.totalEarned,
              totalSpent: wallet.totalSpent,
              totalWithdrawn: wallet.totalWithdrawn,
            }
          : null,
        walletTransactions: transactions,
        giftsSent: gifts,
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error(`Error exporting data for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * Update GDPR or KVKK consent timestamp.
   */
  async updateConsent(userId: string, type: 'gdpr' | 'kvkk'): Promise<void> {
    try {
      const now = new Date()
      const updateData =
        type === 'gdpr'
          ? { consentGdprAt: now, updatedAt: now }
          : { consentKvkkAt: now, updatedAt: now }

      const [updated] = await this.db
        .update(users)
        .set(updateData)
        .where(and(eq(users.id, userId), isNull(users.deletedAt)))
        .returning()

      if (!updated) {
        throw new NotFoundException('User not found')
      }

      this.logger.log(`Consent ${type.toUpperCase()} recorded for user: ${userId}`)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error(`Error updating ${type} consent for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * Create a data export request record.
   */
  async createExportRequest(userId: string): Promise<string> {
    try {
      const [request] = await this.db
        .insert(dataExportRequests)
        .values({
          userId,
          status: 'pending',
        })
        .returning()

      if (!request) {
        throw new Error('Failed to create data export request')
      }

      // Mark user's export requested timestamp
      await this.db
        .update(users)
        .set({
          dataExportRequestedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))

      return request.id
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Error creating export request for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * Get a data export request by ID (scoped to user).
   */
  async getExportRequest(
    exportId: string,
    userId: string,
  ): Promise<{
    id: string
    status: string
    createdAt: Date
    downloadUrl: string | null
    expiresAt: Date | null
  } | null> {
    try {
      const [request] = await this.db
        .select({
          id: dataExportRequests.id,
          status: dataExportRequests.status,
          createdAt: dataExportRequests.createdAt,
          downloadUrl: dataExportRequests.downloadUrl,
          expiresAt: dataExportRequests.expiresAt,
        })
        .from(dataExportRequests)
        .where(and(eq(dataExportRequests.id, exportId), eq(dataExportRequests.userId, userId)))
        .limit(1)

      return request ?? null
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Error getting export request ${exportId} for user: ${userId}`, error)
      throw error
    }
  }

  // ─── End GDPR / KVKK Methods ────────────────────────────────────────

  /**
   * Update lastActiveDate and maintain streak logic.
   *
   * Streak rules:
   * - If user was active yesterday, increment currentStreak
   * - If user was active today already, no change
   * - If user missed a day, reset currentStreak to 1
   * - Always update longestStreak if currentStreak exceeds it
   */
  async updateLastActive(userId: string): Promise<void> {
    try {
      const user = await this.findById(userId)
      if (!user) return

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      let newStreak = user.currentStreak
      let newLongestStreak = user.longestStreak

      if (user.lastActiveDate) {
        const lastActive = new Date(user.lastActiveDate)
        const lastActiveDay = new Date(
          lastActive.getFullYear(),
          lastActive.getMonth(),
          lastActive.getDate(),
        )

        const diffMs = today.getTime() - lastActiveDay.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        if (diffDays === 0) {
          // Already active today — no streak change
          return
        } else if (diffDays === 1) {
          // Active yesterday — increment streak
          newStreak = user.currentStreak + 1
        } else {
          // Missed a day or more — reset streak
          newStreak = 1
        }
      } else {
        // First ever activity
        newStreak = 1
      }

      if (newStreak > newLongestStreak) {
        newLongestStreak = newStreak
      }

      await this.db
        .update(users)
        .set({
          lastActiveDate: now,
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          updatedAt: now,
        })
        .where(eq(users.id, userId))
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Error updating last active for user: ${userId}`, error)
      // Non-critical — don't throw, just log
    }
  }

  // ── Voice Note Profile ──────────────────────────────────

  /**
   * Generate a presigned S3 upload URL for a voice note profile.
   * Max 30 seconds, AAC format, 2MB limit.
   */
  async getVoiceNoteUploadUrl(
    userId: string,
  ): Promise<{ uploadUrl: string; mediaUrl: string; key: string }> {
    try {
      const key = `voice-notes/${userId}/${Date.now()}.aac`

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: 'audio/aac',
        ContentLength: 2 * 1024 * 1024, // 2MB max
      })

      const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 })
      const mediaUrl = `${this.cdnBaseUrl}/${key}`

      return { uploadUrl, mediaUrl, key }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Error generating voice note upload URL for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * Save voice note metadata after successful upload.
   * Validates duration is within 30-second limit.
   */
  async saveVoiceNote(userId: string, mediaUrl: string, duration: number): Promise<void> {
    if (duration > 30) {
      throw new BadRequestException('Voice note cannot exceed 30 seconds')
    }
    if (duration < 1) {
      throw new BadRequestException('Voice note must be at least 1 second')
    }

    try {
      await this.db
        .update(users)
        .set({
          voiceNoteUrl: mediaUrl,
          voiceNoteDuration: duration,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Error saving voice note for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * Remove a user's voice note profile.
   */
  async removeVoiceNote(userId: string): Promise<void> {
    try {
      await this.db
        .update(users)
        .set({
          voiceNoteUrl: null,
          voiceNoteDuration: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Error removing voice note for user: ${userId}`, error)
      throw error
    }
  }
}
