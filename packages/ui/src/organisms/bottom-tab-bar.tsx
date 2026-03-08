'use client'

import { forwardRef } from 'react'
import { Compass, Table, PhoneCall, ChatCircleDots, UserCircle } from '@phosphor-icons/react'
import { cn } from '../utils/cn'

const tabs = [
  { key: 'discover', label: 'Discover', icon: Compass },
  { key: 'tables', label: 'Tables', icon: Table },
  { key: 'calls', label: 'Calls', icon: PhoneCall },
  { key: 'matches', label: 'Matches', icon: ChatCircleDots },
  { key: 'profile', label: 'Profile', icon: UserCircle },
] as const

type TabKey = (typeof tabs)[number]['key']

interface BottomTabBarProps extends React.HTMLAttributes<HTMLElement> {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  badges?: Partial<Record<TabKey, number>>
}

const BottomTabBar = forwardRef<HTMLElement, BottomTabBarProps>(
  ({ className, activeTab, onTabChange, badges = {}, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn(
          'z-sticky border-border-subtle fixed bottom-0 left-0 right-0 border-t bg-[var(--surface-glass)] backdrop-blur-xl',
          className,
        )}
        {...props}
      >
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            const Icon = tab.icon
            const badgeCount = badges[tab.key]

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className={cn(
                  'relative flex flex-1 flex-col items-center gap-0.5 py-1 transition-colors',
                  isActive ? 'text-primary' : 'text-text-muted',
                )}
              >
                <div className="relative">
                  <Icon size={24} weight={isActive ? 'fill' : 'regular'} />
                  {badgeCount && badgeCount > 0 ? (
                    <span className="bg-like absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] font-medium">{tab.label}</span>
                {isActive ? (
                  <div className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[image:var(--gradient-brand)]" />
                ) : null}
              </button>
            )
          })}
        </div>
        {/* Safe area padding for iOS */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    )
  },
)
BottomTabBar.displayName = 'BottomTabBar'

export { BottomTabBar, tabs }
export type { BottomTabBarProps, TabKey }
