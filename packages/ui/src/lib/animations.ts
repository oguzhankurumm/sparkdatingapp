/**
 * Spark Animation Library
 * Framer Motion transitions and variants — OGU-139 spec
 */

import type { Transition } from 'framer-motion'

// ─── Transitions ───────────────────────────────────────────
export const transitions = {
  /** Smooth spring — general purpose */
  spring: { type: 'spring', stiffness: 400, damping: 30 } satisfies Transition,

  /** Bouncy spring — match modal, toast, success states */
  bounce: { type: 'spring', stiffness: 600, damping: 20 } satisfies Transition,

  /** CSS-easing smooth — subtle fades, list items */
  smooth: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } satisfies Transition,

  /** CSS-easing fast — micro-interactions, active states */
  fast: { duration: 0.15, ease: [0.4, 0, 0.2, 1] } satisfies Transition,
} as const

// ─── Variants ──────────────────────────────────────────────
export const variants = {
  // Page transitions
  pageEnter: { opacity: 0, y: 16 },
  pageCenter: { opacity: 1, y: 0, transition: transitions.spring },
  pageExit: { opacity: 0, transition: transitions.fast },

  // Swipe card actions
  cardLike: {
    x: '120%',
    rotate: 15,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  cardPass: {
    x: '-120%',
    rotate: -15,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },

  // Match modal
  matchEnter: { scale: 0.7, opacity: 0 },
  matchShow: { scale: 1, opacity: 1, transition: transitions.bounce },

  // Stagger lists (wrap children in staggerParent, give each staggerChild)
  staggerParent: { transition: { staggerChildren: 0.06 } },
  staggerChild: {
    opacity: [0, 1],
    y: [12, 0],
    transition: transitions.spring,
  },

  // Fade in/out
  fadeIn: { opacity: 0 },
  fadeVisible: { opacity: 1, transition: transitions.smooth },
  fadeOut: { opacity: 0, transition: transitions.fast },

  // Bottom sheet slide-up
  sheetHidden: { y: '100%' },
  sheetVisible: { y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  sheetExit: { y: '100%', transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },

  // Notification / toast pop
  toastEnter: { opacity: 0, y: -16, scale: 0.95 },
  toastVisible: { opacity: 1, y: 0, scale: 1, transition: transitions.spring },
  toastExit: { opacity: 0, scale: 0.95, transition: transitions.fast },
} as const satisfies Record<string, object>

// ─── Gesture helpers ───────────────────────────────────────
/** Framer whileTap scale for buttons */
export const tapScale = {
  whileTap: { scale: 0.96, transition: { duration: 0.06 } },
}

/** Framer whileHover + whileTap for interactive cards */
export const cardHover = {
  whileHover: { y: -2, transition: transitions.smooth },
  whileTap: { scale: 0.98, transition: { duration: 0.06 } },
}

// ─── Swipe card drag config ─────────────────────────────────
export const swipeCardDrag = {
  drag: 'x' as const,
  dragElastic: 0.7,
  dragConstraints: { left: 0, right: 0 },
  /** Fire card action when dragged past ±80px */
  SWIPE_THRESHOLD: 80,
}
