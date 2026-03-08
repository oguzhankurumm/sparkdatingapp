'use client'

import { forwardRef } from 'react'
import { cn } from '../utils/cn'
import { BottomTabBar } from '../organisms/bottom-tab-bar'
import type { TabKey } from '../organisms/bottom-tab-bar'

interface AppLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  badges?: Partial<Record<TabKey, number>>
}

const AppLayout = forwardRef<HTMLDivElement, AppLayoutProps>(
  ({ className, activeTab, onTabChange, badges, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('bg-background min-h-screen', className)} {...props}>
        {/* Main content area — padding bottom for tab bar + safe area */}
        <main className="pb-20">{children}</main>

        <BottomTabBar activeTab={activeTab} onTabChange={onTabChange} badges={badges} />
      </div>
    )
  },
)
AppLayout.displayName = 'AppLayout'

export { AppLayout }
export type { AppLayoutProps }
