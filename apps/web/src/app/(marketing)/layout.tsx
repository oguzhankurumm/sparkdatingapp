import type { ReactNode } from 'react'
import { Navbar, Footer } from './components'

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  )
}
