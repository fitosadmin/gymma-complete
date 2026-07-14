import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface SectionProps extends HTMLAttributes<HTMLElement> {
  /** D8.18/8.19 — dark sections must earn their darkness */
  tone?: 'paper' | 'dark'
  /** Corner anchor for the single copper radial glow (dark tone only) */
  glow?: 'tl' | 'tr' | 'bl' | 'br' | 'none'
  /**
   * D4 whitespace law: default 128px desktop / 64px mobile;
   * gravity 160/96 (tiers, reviews); utility 96/48 (FAQ, legal)
   */
  size?: 'default' | 'gravity' | 'utility'
}

const glowPos = {
  tl: 'top-0 left-0 -translate-x-1/3 -translate-y-1/3',
  tr: 'top-0 right-0 translate-x-1/3 -translate-y-1/3',
  bl: 'bottom-0 left-0 -translate-x-1/3 translate-y-1/3',
  br: 'bottom-0 right-0 translate-x-1/3 translate-y-1/3',
}

/**
 * Section band — paper by default; dark = navy-deep + one corner glow.
 * Paper↔navy transitions are hard cuts (D8.19), so no gradient seams here.
 */
export function Section({
  tone = 'paper',
  glow = 'tr',
  size = 'default',
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden',
        tone === 'dark' ? 'bg-navy-deep text-dark-2' : 'bg-paper text-ink',
        size === 'default' && 'py-16 md:py-32',
        size === 'gravity' && 'py-24 md:py-40',
        size === 'utility' && 'py-12 md:py-24',
        className,
      )}
      {...props}
    >
      {tone === 'dark' && glow !== 'none' && (
        <div aria-hidden className={cn('copper-glow absolute', glowPos[glow])} />
      )}
      <div className="relative">{children}</div>
    </section>
  )
}
