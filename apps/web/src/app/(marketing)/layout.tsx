import type { ReactNode } from 'react'
import { LegalFooter } from '@/components/legal-footer'

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <LegalFooter />
    </>
  )
}
