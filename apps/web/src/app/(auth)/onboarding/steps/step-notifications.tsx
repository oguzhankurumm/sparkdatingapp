'use client'

import { useEffect, useState } from 'react'
import { Bell, ChatCircleDots, Heart, Sparkle } from '@phosphor-icons/react'
import { Button, cn } from '@spark/ui'
import type { OnboardingData } from '@/lib/stores/onboarding-store'

interface StepNotificationsProps {
  data: OnboardingData
  updateData: (partial: Partial<OnboardingData>) => void
  onValidChange: (valid: boolean) => void
}

const NOTIFICATION_BENEFITS = [
  {
    icon: Heart,
    title: 'New Matches',
    description: 'Know instantly when someone likes you back',
  },
  {
    icon: ChatCircleDots,
    title: 'Messages',
    description: 'Never miss a conversation',
  },
  {
    icon: Sparkle,
    title: 'Special Offers',
    description: 'Get notified about boosts and rewards',
  },
]

export function StepNotifications({ data, updateData, onValidChange }: StepNotificationsProps) {
  const [permissionState, setPermissionState] = useState<'default' | 'granted' | 'denied'>(
    'default',
  )

  // This step is optional — always valid
  useEffect(() => {
    onValidChange(true)
  }, [onValidChange])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission)
    }
  }, [])

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      updateData({ notificationsEnabled: false })
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setPermissionState(permission)
      updateData({ notificationsEnabled: permission === 'granted' })
    } catch {
      updateData({ notificationsEnabled: false })
    }
  }

  const isGranted = permissionState === 'granted' || data.notificationsEnabled === true

  return (
    <div className="flex flex-1 flex-col items-center gap-6 pt-4">
      {/* Bell icon */}
      <div
        className={cn(
          'flex h-28 w-28 items-center justify-center rounded-full transition-all duration-300',
          isGranted ? 'bg-success/10' : 'bg-primary-light bg-[image:var(--gradient-brand)]',
        )}
      >
        <Bell
          size={56}
          weight="fill"
          className={cn('transition-colors', isGranted ? 'text-success' : 'text-primary')}
        />
      </div>

      {/* Heading */}
      <div className="text-center">
        <h2 className="font-heading text-text-primary text-2xl font-bold">
          {isGranted ? "You're all set!" : 'Never miss a match!'}
        </h2>
        <p className="text-text-secondary mt-2 text-sm">
          {isGranted
            ? "You'll be notified about matches, messages, and more."
            : 'Turn on notifications so you never miss when someone likes you.'}
        </p>
      </div>

      {/* Benefits */}
      <div className="w-full space-y-3">
        {NOTIFICATION_BENEFITS.map((benefit) => {
          const Icon = benefit.icon
          return (
            <div
              key={benefit.title}
              className="bg-surface-elevated flex items-center gap-3 rounded-xl p-3"
            >
              <div className="bg-primary-light flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <Icon size={20} weight="fill" className="text-primary" />
              </div>
              <div>
                <p className="text-text-primary text-sm font-semibold">{benefit.title}</p>
                <p className="text-text-muted text-xs">{benefit.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Enable button */}
      {!isGranted ? (
        <Button
          variant="primary"
          size="lg"
          onClick={handleEnableNotifications}
          className="mt-2 w-full"
          disabled={permissionState === 'denied'}
        >
          <Bell size={18} weight="bold" />
          Enable Notifications
        </Button>
      ) : (
        <div className="bg-success/10 mt-2 rounded-xl px-6 py-3 text-center">
          <p className="text-success text-sm font-semibold">Notifications enabled</p>
        </div>
      )}

      {permissionState === 'denied' ? (
        <p className="text-text-muted text-center text-xs">
          Notifications are blocked. You can enable them in your browser settings.
        </p>
      ) : null}
    </div>
  )
}
