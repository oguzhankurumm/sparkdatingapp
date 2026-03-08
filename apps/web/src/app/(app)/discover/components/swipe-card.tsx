'use client'

import { useRef } from 'react'
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimationControls,
  type PanInfo,
} from 'framer-motion'
import { ProfileCard } from '@spark/ui'

interface SwipeCardProps {
  id: string
  name: string
  age: number
  photo: string
  matchPercent?: number
  zodiac?: string
  distance?: string
  verified?: boolean
  /** Z-index layer: 0 = front, 1 = middle, 2 = back */
  layer: number
  onSwipe: (direction: 'left' | 'right') => void
  onSuperLike?: () => void
}

const SWIPE_THRESHOLD = 150
const EXIT_X = 600

export function SwipeCard({
  id,
  name,
  age,
  photo,
  matchPercent,
  zodiac,
  distance,
  verified,
  layer,
  onSwipe,
}: SwipeCardProps) {
  const controls = useAnimationControls()
  const x = useMotionValue(0)
  const isFront = layer === 0
  const constraintRef = useRef<HTMLDivElement>(null)

  // Transform drag x into card rotation
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15])

  // LIKE stamp opacity: appears when dragging right
  const likeOpacity = useTransform(x, [0, 100], [0, 1])

  // NOPE stamp opacity: appears when dragging left
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0])

  // Scale for stacked cards behind the front card
  const stackScale = 1 - layer * 0.05
  const stackY = layer * 8

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const offsetX = info.offset.x

    if (Math.abs(offsetX) > SWIPE_THRESHOLD) {
      const direction = offsetX > 0 ? 'right' : 'left'
      const exitX = direction === 'right' ? EXIT_X : -EXIT_X

      void controls.start({
        x: exitX,
        opacity: 0,
        transition: { duration: 0.3, ease: 'easeOut' },
      })

      // Fire callback after animation starts
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

  /** Programmatic swipe (triggered by buttons) */
  async function _animateSwipe(direction: 'left' | 'right') {
    const exitX = direction === 'right' ? EXIT_X : -EXIT_X

    await controls.start({
      x: exitX,
      opacity: 0,
      transition: { duration: 0.35, ease: 'easeOut' },
    })

    onSwipe(direction)
  }

  return (
    <motion.div
      ref={constraintRef}
      data-card-id={id}
      className="absolute inset-0"
      style={{
        zIndex: 10 - layer,
        cursor: isFront ? 'grab' : 'default',
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
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <motion.div
        className="h-full w-full"
        style={isFront ? { x, rotate } : undefined}
        drag={isFront ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        onDragEnd={isFront ? handleDragEnd : undefined}
        animate={controls}
        whileTap={isFront ? { cursor: 'grabbing' } : undefined}
      >
        <ProfileCard
          name={name}
          age={age}
          photo={photo}
          matchPercent={matchPercent}
          zodiac={zodiac}
          distance={distance}
          verified={verified}
          stamp={
            isFront
              ? (() => {
                  const currentX = x.get()
                  if (currentX > 30) return 'like'
                  if (currentX < -30) return 'nope'
                  return null
                })()
              : null
          }
          stampOpacity={0}
        />

        {/* Overlay stamps driven by motion values */}
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

// Re-export the animateSwipe method via a ref-based approach
// The page component will use button click handlers that
// directly manipulate the card stack instead.
export type { SwipeCardProps }
