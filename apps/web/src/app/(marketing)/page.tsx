import type { Metadata } from 'next'
import {
  HeroSection,
  HowItWorks,
  FeaturesSection,
  Testimonials,
  ForHerSection,
  DownloadSection,
  FinalCta,
  FaqSection,
} from './components'

export const metadata: Metadata = {
  title: 'Spark — Dating That Feels Real',
  description:
    'Skip the endless swiping. Spark connects you through video calls, live tables, and AI-powered compatibility. Free to start.',
  openGraph: {
    title: 'Spark — Dating That Feels Real',
    description:
      'Skip the endless swiping. Spark connects you through video calls, live tables, and AI-powered compatibility.',
    type: 'website',
  },
}

export default function LandingPage() {
  return (
    <main>
      <HeroSection />
      <HowItWorks />
      <FeaturesSection />
      <ForHerSection />
      <Testimonials />
      <DownloadSection />
      <FaqSection />
      <FinalCta />
    </main>
  )
}
