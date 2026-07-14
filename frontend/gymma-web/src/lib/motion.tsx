import { LazyMotion, domAnimation, MotionConfig } from 'framer-motion'
import type { ReactNode } from 'react'
import type { Transition, Variants } from 'framer-motion'

/* ============================================================
   Motion tokens — Blueprint D6 "weighted calm".
   Decisive arrival, one soft spring only, no idle fidgeting.
   ============================================================ */

/** Durations in seconds (Framer Motion units). CSS reads --t-* vars. */
export const dur = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
  story: 0.7,
  cine: 1.2,
} as const

export const ease = {
  outSoft: [0.22, 1, 0.36, 1],
  inOutSmooth: [0.65, 0, 0.35, 1],
  exit: [0.4, 0, 1, 1],
} as const

/** The ONLY spring in the system (D6). */
export const springSettle: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 28,
}

/* --- Level 3: section reveals — 400ms, 24px rise, once --- */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: dur.slow, ease: [...ease.outSoft] },
  },
}

/* --- Level 4: cards & grids — 350ms, 16px rise, staggered --- */
export const cardRise: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [...ease.outSoft] },
  },
}

/** Stagger container — never more than 6 staggered children (D6). */
export function staggerContainer(staggerMs = 80): Variants {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: staggerMs / 1000 } },
  }
}

/** Level 3/4 viewport trigger: 18% intersection, once (D4). */
export const revealViewport = { once: true, amount: 0.18 } as const

/* ============================================================
   MotionProvider — global motion infrastructure.
   - LazyMotion domAnimation keeps the base bundle slim (D13).
   - MotionConfig reducedMotion="user" is the JS half of the
     global reduced-motion switch (CSS half lives in index.css).
   ============================================================ */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}
