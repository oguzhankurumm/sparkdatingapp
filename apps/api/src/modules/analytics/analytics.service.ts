import type { OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { Injectable, Logger } from '@nestjs/common'
import * as amplitude from '@amplitude/analytics-node'
import { Statsig, type StatsigUser } from 'statsig-node'

@Injectable()
export class AnalyticsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AnalyticsService.name)
  private amplitudeReady = false
  private statsigReady = false

  async onModuleInit() {
    // ── Amplitude ───────────────────────────────
    const ampKey = process.env.AMPLITUDE_API_KEY
    if (ampKey) {
      amplitude.init(ampKey)
      this.amplitudeReady = true
      this.logger.log('Amplitude initialized')
    }

    // ── Statsig ─────────────────────────────────
    const statsigKey = process.env.STATSIG_SERVER_SDK_KEY
    if (statsigKey) {
      await Statsig.initialize(statsigKey, {
        environment: { tier: process.env.NODE_ENV ?? 'development' },
      })
      this.statsigReady = true
      this.logger.log('Statsig initialized')
    }
  }

  async onModuleDestroy() {
    if (this.amplitudeReady) {
      await amplitude.flush()
    }
    if (this.statsigReady) {
      Statsig.shutdown()
    }
  }

  // ── Amplitude: track server-side events ──────

  track(userId: string, eventName: string, properties?: Record<string, unknown>) {
    if (!this.amplitudeReady) return
    amplitude.track(eventName, properties, { user_id: userId })
  }

  identify(userId: string, properties: Record<string, unknown>) {
    if (!this.amplitudeReady) return
    const identifyObj = new amplitude.Identify()
    for (const [key, value] of Object.entries(properties)) {
      identifyObj.set(key, value as string | number | boolean)
    }
    amplitude.identify(identifyObj, { user_id: userId })
  }

  // ── Statsig: feature gates ───────────────────

  checkGate(userId: string, gateName: string): boolean {
    if (!this.statsigReady) return false
    const user: StatsigUser = { userID: userId }
    return Statsig.checkGate(user, gateName)
  }

  getConfig(userId: string, configName: string): Record<string, unknown> {
    if (!this.statsigReady) return {}
    const user: StatsigUser = { userID: userId }
    const config = Statsig.getConfig(user, configName)
    return config.value as Record<string, unknown>
  }

  getExperiment(userId: string, experimentName: string): Record<string, unknown> {
    if (!this.statsigReady) return {}
    const user: StatsigUser = { userID: userId }
    const experiment = Statsig.getExperiment(user, experimentName)
    return experiment.value as Record<string, unknown>
  }
}
