'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CaretLeft, CaretDown, MagnifyingGlass } from '@phosphor-icons/react'

// ──────────────────────────────────────────────
// FAQ Data
// ──────────────────────────────────────────────

interface FaqItem {
  q: string
  a: string
}

interface FaqCategory {
  title: string
  items: FaqItem[]
}

const FAQ_DATA: FaqCategory[] = [
  {
    title: 'Getting Started',
    items: [
      {
        q: 'How do I create my profile?',
        a: "After signing up, you'll go through a 9-step onboarding process where you add your photos, bio, interests, and preferences. You need at least 2 photos and 3 interests to complete your profile.",
      },
      {
        q: 'How does matching work?',
        a: "You can discover people by swiping (like Tinder) or browsing profiles. When both people like each other, it's a match! You have 72 hours to send a message before the match expires.",
      },
      {
        q: 'What is a Super Like?',
        a: "A Super Like lets the other person know you're especially interested. It increases your chances of matching by 3x. Free users get 1 per day, Premium gets 5, and Platinum gets unlimited.",
      },
    ],
  },
  {
    title: 'Tokens & Payments',
    items: [
      {
        q: 'What are tokens?',
        a: "Tokens are Spark's virtual currency. 1 USD = 100 tokens. You earn tokens through gifts, referrals, and bonuses. You can use them for boosts, gifts, video calls, and more.",
      },
      {
        q: 'How do I withdraw my tokens?',
        a: 'Go to Profile > Wallet > Withdraw. Minimum withdrawal is 5,000 tokens ($50). Your account must be at least 30 days old. KYC verification is required for withdrawals over 50,000 tokens.',
      },
      {
        q: 'What happens if I get disconnected during a video call?',
        a: "Video calls are billed per minute. If you get disconnected, billing stops immediately. However, there are no refunds for completed minutes — you're warned about this before starting a call.",
      },
    ],
  },
  {
    title: 'Subscriptions',
    items: [
      {
        q: "What's the difference between Premium and Platinum?",
        a: 'Premium ($19.99/mo) includes unlimited likes, see who liked you, rewind, advanced filters, read receipts, 5 boosts/mo, and Auto Translate. Platinum ($29.99/mo) adds Dating Helper AI, incognito mode, priority discovery, 1000 bonus tokens/mo, and AI Compatibility details.',
      },
      {
        q: 'Can I cancel my subscription?',
        a: 'Yes, you can cancel anytime from Settings > Manage Subscription. Your premium features remain active until the end of your billing period.',
      },
      {
        q: 'Do women get free premium features?',
        a: 'Yes! Female users get unlimited likes, daily "who liked me" views (5/day), rewind, advanced filters, read receipts, and 1 weekly boost — all for free.',
      },
    ],
  },
  {
    title: 'Safety & Privacy',
    items: [
      {
        q: 'How do I report someone?',
        a: 'Tap the "..." menu on any profile or in a chat conversation and select "Report". Choose the reason, add optional details, and submit. Our moderation team reviews all reports within 24 hours.',
      },
      {
        q: 'What is the Panic Button?',
        a: 'The Panic Button is a safety feature you can activate during dates. Hold it for 3 seconds to: hide your profile, share your location with emergency contacts, and optionally alert local services. Find it in Settings > Safety.',
      },
      {
        q: 'How do I get verified?',
        a: 'Go to Settings > Verify Account. Take a selfie matching the pose shown, and our team will verify it matches your profile photos. Verification usually takes 1-24 hours.',
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        q: 'Can I delete my account?',
        a: 'Yes. Go to Settings > Delete Account. Your account will be deactivated for 30 days (in case you change your mind), then permanently deleted along with all your data.',
      },
      {
        q: 'What happens to my tokens if I delete my account?',
        a: 'Any remaining token balance is forfeited when your account is permanently deleted. Make sure to withdraw your tokens before deleting your account.',
      },
    ],
  },
]

// ──────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────

export default function FaqPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [openItem, setOpenItem] = useState<string | null>(null)

  const filtered = search.trim()
    ? FAQ_DATA.map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.q.toLowerCase().includes(search.toLowerCase()) ||
            item.a.toLowerCase().includes(search.toLowerCase()),
        ),
      })).filter((cat) => cat.items.length > 0)
    : FAQ_DATA

  return (
    <div className="mx-auto max-w-2xl pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-2 pt-4">
        <button
          onClick={() => router.back()}
          className="text-text-muted hover:text-text-primary flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          aria-label="Go back"
        >
          <CaretLeft className="h-5 w-5" />
        </button>
        <h1 className="text-text-primary text-xl font-bold">FAQ</h1>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="border-border bg-surface-elevated flex items-center gap-2 rounded-xl border px-3 py-2.5">
          <MagnifyingGlass className="text-text-muted h-4 w-4 shrink-0" />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-text-primary placeholder:text-text-muted w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-6 px-4">
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-text-muted text-sm">No results found. Try a different search.</p>
          </div>
        )}

        {filtered.map((cat) => (
          <div key={cat.title}>
            <h2 className="text-text-muted mb-3 text-xs font-semibold uppercase tracking-wider">
              {cat.title}
            </h2>
            <div className="border-border bg-surface-elevated divide-border divide-y rounded-2xl border">
              {cat.items.map((item) => {
                const key = `${cat.title}-${item.q}`
                const isOpen = openItem === key
                return (
                  <button
                    key={key}
                    onClick={() => setOpenItem(isOpen ? null : key)}
                    className="w-full px-4 py-3.5 text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-text-primary text-sm font-medium">{item.q}</p>
                      <CaretDown
                        className={`text-text-muted mt-0.5 h-4 w-4 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                    {isOpen && (
                      <p className="text-text-secondary mt-2 text-sm leading-relaxed">{item.a}</p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
