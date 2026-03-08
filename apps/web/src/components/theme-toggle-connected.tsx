'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { ThemeToggle } from '@spark/ui'

export function ThemeToggleConnected({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-8 w-16" />
  }

  return (
    <ThemeToggle
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      onChange={(theme) => setTheme(theme)}
      className={className}
    />
  )
}
