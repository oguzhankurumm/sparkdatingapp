'use client'

import { useCallback, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AppLayout } from '@spark/ui'
import type { TabKey } from '@spark/ui'

const pathnameToTab: Record<string, TabKey> = {
  '/discover': 'discover',
  '/tables': 'tables',
  '/calls': 'calls',
  '/matches': 'matches',
  '/profile': 'profile',
}

const tabToPathname: Record<TabKey, string> = {
  discover: '/discover',
  tables: '/tables',
  calls: '/calls',
  matches: '/matches',
  profile: '/profile',
}

function getActiveTab(pathname: string): TabKey {
  // Try exact match first
  const exact = pathnameToTab[pathname]
  if (exact) return exact

  // Try prefix match (e.g. /discover/settings -> discover)
  for (const [prefix, tab] of Object.entries(pathnameToTab)) {
    if (pathname.startsWith(prefix)) {
      return tab
    }
  }

  // Default to discover
  return 'discover'
}

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const activeTab = getActiveTab(pathname)

  const handleTabChange = useCallback(
    (tab: TabKey) => {
      const target = tabToPathname[tab]
      if (target && target !== pathname) {
        // Cast needed because Next.js typed routes plugin requires literal route strings
        router.push(target as Parameters<typeof router.push>[0])
      }
    },
    [router, pathname],
  )

  return (
    <AppLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      badges={{
        matches: 3, // Placeholder — wire up to real notification count
      }}
    >
      {children}
    </AppLayout>
  )
}
