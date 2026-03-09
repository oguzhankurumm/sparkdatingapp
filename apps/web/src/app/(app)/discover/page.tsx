'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimationControls,
  AnimatePresence,
  type PanInfo,
} from 'framer-motion'
import { Cards, SquaresFour, FunnelSimple, X, Star, Heart, Lightning } from '@phosphor-icons/react'
import { ProfileCard, GradientText, Button, Skeleton, StoryBar } from '@spark/ui'
import { useDiscoverFeed, useSendLike, type DiscoverProfile } from './hooks'
import { ReadyToCallRow } from './components/ready-to-call-row'
import { TrendingGrid } from './components/trending-grid'
import { NearbyTablesRow } from './components/nearby-tables-row'
import { NearbySection } from './components/nearby-section'
import { LikesReceivedRow } from './components/likes-received-row'

// ── Types ──────────────────────────────────────────────

type DiscoverMode = 'swipe' | 'browse'

const MODE_KEY = 'spark_discover_mode'

// ── Placeholder stories for StoryBar ───────────────────

const PLACEHOLDER_STORIES = [
  { id: '1', username: 'Sophie', avatar: 'https://i.pravatar.cc/150?img=1', seen: false },
  { id: '2', username: 'Marcus', avatar: 'https://i.pravatar.cc/150?img=3', seen: false },
  { id: '3', username: 'Lily', avatar: 'https://i.pravatar.cc/150?img=5', seen: true },
  { id: '4', username: 'James', avatar: 'https://i.pravatar.cc/150?img=7', seen: false },
  { id: '5', username: 'Emma', avatar: 'https://i.pravatar.cc/150?img=9', seen: true },
  { id: '6', username: 'Noah', avatar: 'https://i.pravatar.cc/150?img=11', seen: false },
]

// ── Main Page ──────────────────────────────────────────

export default function DiscoverPage() {
  const [mode, setMode] = useState<DiscoverMode>('swipe')

  // Load mode preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(MODE_KEY)
    if (saved === 'browse' || saved === 'swipe') {
      setMode(saved)
    }
  }, [])

  function handleModeChange(newMode: DiscoverMode) {
    setMode(newMode)
    localStorage.setItem(MODE_KEY, newMode)
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <DiscoverHeader mode={mode} onModeChange={handleModeChange} />

      {/* Content */}
      <AnimatePresence mode="wait">
        {mode === 'swipe' ? (
          <motion.div
            key="swipe"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            <SwipeSection />
          </motion.div>
        ) : (
          <motion.div
            key="browse"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            <BrowseSection />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Header ─────────────────────────────────────────────

function DiscoverHeader({
  mode,
  onModeChange,
}: {
  mode: DiscoverMode
  onModeChange: (mode: DiscoverMode) => void
}) {
  return (
    <header className="border-border-subtle bg-background/80 sticky top-0 z-30 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        {/* Logo */}
        <GradientText as="h1" gradient="brand" className="font-heading text-2xl font-bold">
          Spark
        </GradientText>

        {/* Mode toggle + filter */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onModeChange('swipe')}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              mode === 'swipe'
                ? 'bg-primary/10 text-primary'
                : 'text-text-muted hover:text-text-secondary'
            }`}
            aria-label="Swipe mode"
          >
            <Cards size={20} weight={mode === 'swipe' ? 'fill' : 'regular'} />
          </button>
          <button
            type="button"
            onClick={() => onModeChange('browse')}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              mode === 'browse'
                ? 'bg-primary/10 text-primary'
                : 'text-text-muted hover:text-text-secondary'
            }`}
            aria-label="Browse mode"
          >
            <SquaresFour size={20} weight={mode === 'browse' ? 'fill' : 'regular'} />
          </button>

          <div className="bg-border-subtle mx-1 h-5 w-px" />

          <button
            type="button"
            className="text-text-muted hover:text-text-secondary flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
            aria-label="Filters"
          >
            <FunnelSimple size={20} weight="bold" />
          </button>
        </div>
      </div>
    </header>
  )
}

// ── Swipe Section ──────────────────────────────────────

function SwipeSection() {
  const { data, isLoading } = useDiscoverFeed()
  const { mutate: sendLike } = useSendLike()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const profiles = data?.profiles ?? []
  const remainingProfiles = profiles.slice(currentIndex)
  const visibleCards = remainingProfiles.slice(0, 3)

  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (isAnimating || currentIndex >= profiles.length) return

      const profile = profiles[currentIndex]
      if (!profile) return

      setIsAnimating(true)
      setExitDirection(direction)

      sendLike({
        receiverId: profile.user.id,
        type: direction === 'right' ? 'like' : 'pass',
      })

      // Wait for animation to complete before advancing
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1)
        setExitDirection(null)
        setIsAnimating(false)
      }, 300)
    },
    [currentIndex, profiles, isAnimating, sendLike],
  )

  const handleSuperLike = useCallback(() => {
    if (isAnimating || currentIndex >= profiles.length) return

    const profile = profiles[currentIndex]
    if (!profile) return

    setIsAnimating(true)

    sendLike({
      receiverId: profile.user.id,
      type: 'super_like',
    })

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1)
      setIsAnimating(false)
    }, 300)
  }, [currentIndex, profiles, isAnimating, sendLike])

  // Loading state
  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-4">
        <Skeleton variant="card" className="w-full" />
      </div>
    )
  }

  // Empty state
  if (profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16">
        <div className="bg-primary/10 flex h-20 w-20 items-center justify-center rounded-full">
          <Heart size={40} className="text-primary" />
        </div>
        <h2 className="font-heading text-text-primary text-xl font-bold">{'No More Profiles'}</h2>
        <p className="text-text-muted max-w-xs text-center text-sm">
          {"You've seen everyone nearby. Try adjusting your filters or check back later."}
        </p>
        <Button variant="secondary" onClick={() => setCurrentIndex(0)} className="mt-2">
          Start Over
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col px-4 pt-4">
      {/* Card stack */}
      <div className="relative aspect-[3/4] w-full">
        <AnimatePresence>
          {visibleCards.map((profile, index) => (
            <SwipeableCard
              key={profile.user.id}
              profile={profile}
              layer={index}
              isExiting={index === 0 && exitDirection !== null}
              exitDirection={exitDirection}
              onSwipe={index === 0 ? handleSwipe : undefined}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-4 py-6">
        <Button
          variant="pass"
          size="icon-lg"
          rounded="full"
          onClick={() => handleSwipe('left')}
          disabled={isAnimating}
          aria-label="Pass"
        >
          <X size={28} weight="bold" />
        </Button>

        <Button
          variant="super-like"
          size="icon"
          rounded="full"
          onClick={handleSuperLike}
          disabled={isAnimating}
          aria-label="Super Like"
        >
          <Star size={22} weight="fill" />
        </Button>

        <Button
          variant="like"
          size="icon-lg"
          rounded="full"
          onClick={() => handleSwipe('right')}
          disabled={isAnimating}
          aria-label="Like"
        >
          <Heart size={28} weight="fill" />
        </Button>

        <Button variant="secondary" size="icon" rounded="full" aria-label="Boost">
          <Lightning size={22} weight="fill" className="text-boost" />
        </Button>
      </div>
    </div>
  )
}

// ── Swipeable Card (inline for motion value access) ────

function SwipeableCard({
  profile,
  layer,
  isExiting,
  exitDirection,
  onSwipe,
}: {
  profile: DiscoverProfile
  layer: number
  isExiting: boolean
  exitDirection: 'left' | 'right' | null
  onSwipe?: (direction: 'left' | 'right') => void
}) {
  const controls = useAnimationControls()
  const x = useMotionValue(0)
  const isFront = layer === 0
  const hasCalledSwipe = useRef(false)

  // Transform drag x into card rotation
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15])

  // LIKE stamp opacity: appears when dragging right
  const likeOpacity = useTransform(x, [0, 100], [0, 1])

  // NOPE stamp opacity: appears when dragging left
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0])

  // Scale for stacked cards behind the front card
  const stackScale = 1 - layer * 0.05
  const stackY = layer * 8

  const SWIPE_THRESHOLD = 150
  const EXIT_X = 600

  // Handle button-triggered exit animation
  useEffect(() => {
    if (isExiting && exitDirection && isFront) {
      const exitX = exitDirection === 'right' ? EXIT_X : -EXIT_X
      void controls.start({
        x: exitX,
        opacity: 0,
        transition: { duration: 0.3, ease: 'easeOut' },
      })
    }
  }, [isExiting, exitDirection, isFront, controls])

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const offsetX = info.offset.x

    if (Math.abs(offsetX) > SWIPE_THRESHOLD && onSwipe && !hasCalledSwipe.current) {
      hasCalledSwipe.current = true
      const direction = offsetX > 0 ? 'right' : 'left'
      const exitX = direction === 'right' ? EXIT_X : -EXIT_X

      void controls.start({
        x: exitX,
        opacity: 0,
        transition: { duration: 0.3, ease: 'easeOut' },
      })

      setTimeout(() => {
        onSwipe(direction)
      }, 200)
    } else {
      // Snap back
      void controls.start({
        x: 0,
        transition: { type: 'spring', stiffness: 500, damping: 30 },
      })
    }
  }

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        zIndex: 10 - layer,
        pointerEvents: isFront ? 'auto' : 'none',
      }}
      initial={{
        scale: stackScale,
        y: stackY,
        opacity: layer > 2 ? 0 : 1,
      }}
      animate={{
        scale: stackScale,
        y: stackY,
        opacity: layer > 2 ? 0 : 1,
      }}
      exit={{
        x: exitDirection === 'right' ? EXIT_X : -EXIT_X,
        opacity: 0,
        transition: { duration: 0.3 },
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <motion.div
        className="h-full w-full"
        style={isFront ? { x, rotate, cursor: 'grab' } : undefined}
        drag={isFront ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        onDragEnd={isFront ? handleDragEnd : undefined}
        animate={controls}
        whileTap={isFront ? { cursor: 'grabbing' } : undefined}
      >
        {/* Profile card with stamp hidden (we render custom motion stamps) */}
        <ProfileCard
          name={profile.user.firstName}
          age={profile.user.age}
          photo={profile.user.avatarUrl}
          matchPercent={profile.score}
          zodiac={profile.user.zodiac}
          zodiacCompat={profile.user.zodiacCompat}
          distance={profile.user.distance}
          verified={profile.user.isVerified}
          stamp={null}
          stampOpacity={0}
        />

        {/* Motion-driven LIKE / NOPE stamps */}
        {isFront ? (
          <>
            <motion.div
              className="border-success text-success pointer-events-none absolute left-6 top-8 -rotate-12 rounded-lg border-4 px-4 py-2 text-3xl font-extrabold tracking-wider"
              style={{ opacity: likeOpacity }}
            >
              LIKE
            </motion.div>
            <motion.div
              className="border-danger text-danger pointer-events-none absolute right-6 top-8 rotate-12 rounded-lg border-4 px-4 py-2 text-3xl font-extrabold tracking-wider"
              style={{ opacity: nopeOpacity }}
            >
              NOPE
            </motion.div>
          </>
        ) : null}
      </motion.div>
    </motion.div>
  )
}

// ── Browse Section ─────────────────────────────────────

function BrowseSection() {
  return (
    <div className="mx-auto max-w-lg space-y-6 pb-8">
      {/* Stories */}
      <StoryBar
        stories={PLACEHOLDER_STORIES}
        onStoryClick={(_id) => {
          // Story viewing — not yet implemented
        }}
        onAddStory={() => {
          // Story creation — not yet implemented
        }}
      />

      {/* Section 1: People Who Like You (blurred for free tier) */}
      <LikesReceivedRow />

      {/* Section 2: Ready to Chat */}
      <ReadyToCallRow />

      {/* Section 3: Trending This Week */}
      <TrendingGrid />

      {/* Section 4: Nearby Tables */}
      <NearbyTablesRow />

      {/* Section 5: People Nearby */}
      <NearbySection />
    </div>
  )
}
