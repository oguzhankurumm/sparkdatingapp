import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { HealthController } from './health.controller'
import { DatabaseModule } from './database/database.module'
import { JwtAuthGuard } from './common/guards/jwt-auth.guard'

// Feature modules
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { DiscoveryModule } from './modules/discovery/discovery.module'
import { MatchingModule } from './modules/matching/matching.module'
import { MessagingModule } from './modules/messaging/messaging.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module'
import { ModerationModule } from './modules/moderation/moderation.module'
import { AnalyticsModule } from './modules/analytics/analytics.module'
import { AdminModule } from './modules/admin/admin.module'
import { TablesModule } from './modules/tables/tables.module'
import { VideoCallsModule } from './modules/video-calls/video-calls.module'
import { WalletModule } from './modules/wallet/wallet.module'
import { GiftsModule } from './modules/gifts/gifts.module'
import { DailySpinModule } from './modules/daily-spin/daily-spin.module'
import { ZodiacModule } from './modules/zodiac/zodiac.module'
import { DatingHelperModule } from './modules/dating-helper/dating-helper.module'
import { TranslateModule } from './modules/translate/translate.module'
import { ReferralsModule } from './modules/referrals/referrals.module'
import { BoostModule } from './modules/boost/boost.module'
import { LiveStreamModule } from './modules/live-stream/live-stream.module'
import { StoriesModule } from './modules/stories/stories.module'
import { SpeedDatingModule } from './modules/speed-dating/speed-dating.module'
import { BadgesModule } from './modules/badges/badges.module'
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module'
import { SafeDateModule } from './modules/safe-date/safe-date.module'
import { SafetyModule } from './modules/safety/safety.module'
import { AiModule } from './modules/ai/ai.module'
import { IcebreakerModule } from './modules/icebreaker/icebreaker.module'
import { GiphyModule } from './modules/giphy/giphy.module'
import { KycModule } from './modules/kyc/kyc.module'
import { EmailModule } from './modules/email/email.module'

@Module({
  imports: [
    // Core
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
    }),
    DatabaseModule,

    // Feature modules
    AuthModule,
    UsersModule,
    DiscoveryModule,
    MatchingModule,
    MessagingModule,
    NotificationsModule,
    SubscriptionsModule,
    ModerationModule,
    AnalyticsModule,
    AdminModule,
    TablesModule,
    VideoCallsModule,
    WalletModule,
    GiftsModule,
    DailySpinModule,
    ZodiacModule,
    DatingHelperModule,
    TranslateModule,
    ReferralsModule,
    BoostModule,
    LiveStreamModule,
    StoriesModule,
    SpeedDatingModule,
    BadgesModule,
    LeaderboardModule,
    SafeDateModule,
    SafetyModule,
    AiModule,
    IcebreakerModule,
    GiphyModule,
    KycModule,
    EmailModule,
  ],
  controllers: [HealthController],
  providers: [
    // Global JWT guard — all routes require auth unless @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
