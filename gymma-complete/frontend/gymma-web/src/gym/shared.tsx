import { useState } from 'react'
import type { ImgHTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../lib/cn'
import type { Tier } from '../components/ui'

/* Shared foundations for the gym page — one visual grammar, many acts. */

export interface GymMeta {
  tier: Tier
  rating: number
  reviews: number
  sampleReviews: { stars: number; text: string; date: string }[]
}

/** Enter-only reveal — the page's one reveal grammar (Level 3/4). */
export const rise = (delay = 0, y = 22) => ({
  initial: { opacity: 0, y },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
})

/**
 * Editorial act header — a full-canvas composition, never a lonely heading:
 * ghost act numeral · copper-dash eyebrow · display title (1–2 lines)
 * · right-aligned answering stat. The void is part of the design now.
 */
export function ActHeader({
  index,
  eyebrow,
  title,
  kicker,
  aside,
  dark = false,
  className,
}: {
  index: string
  eyebrow: string
  title: ReactNode
  kicker?: string
  aside?: ReactNode
  dark?: boolean
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -top-10 right-0 select-none font-expanded text-[130px] font-black leading-none md:-top-16 md:text-[220px]',
          dark ? 'text-white/[.05]' : 'text-navy/[.05]',
        )}
      >
        {index}
      </span>
      <div className="relative flex flex-wrap items-end justify-between gap-x-14 gap-y-10">
        <div className="min-w-0">
          <p className="eyebrow flex items-center gap-3">
            <span aria-hidden className="h-px w-10 shrink-0 bg-copper" />
            {eyebrow}
          </p>
          {/* max-width lives ON the h2 so ch tracks the display size */}
          <h2 className={cn('mt-4 max-w-[15ch] text-display', dark ? 'text-dark-1' : 'text-navy')}>{title}</h2>
          {kicker && (
            <p className={cn('mt-5 max-w-[52ch] text-body-l', dark ? 'text-dark-2' : 'text-muted')}>{kicker}</p>
          )}
        </div>
        {aside && <div className="relative shrink-0">{aside}</div>}
      </div>
    </div>
  )
}

/** The stat that answers the headline from across the row. */
export function AsideStat({ value, label, dark = false }: { value: ReactNode; label: string; dark?: boolean }) {
  return (
    <div className="text-right">
      <p className="text-numeric text-[56px] leading-none text-gradient-copper md:text-[84px]">{value}</p>
      <p className={cn('mt-2 text-[12px] uppercase tracking-[2px]', dark ? 'text-dark-3' : 'text-muted')}>{label}</p>
    </div>
  )
}

/** Image that eases in on load — uploads never pop. */
export function FadeImage({ className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState(false)
  return (
    <img
      {...props}
      onLoad={() => setLoaded(true)}
      className={cn(className, 'transition-opacity duration-(--t-slow) ease-out-soft', loaded ? 'opacity-100' : 'opacity-0')}
    />
  )
}

/** Empty optional content stays premium — designed absence, not a hole. */
export function EmptyNote({ icon: Icon, text, dark = false }: { icon: LucideIcon; text: string; dark?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-md border border-dashed px-6 py-7',
        dark ? 'border-copper/25 bg-navy-raised/60 text-dark-2' : 'border-line bg-card/60 text-muted',
      )}
    >
      <span className="icon-tile shrink-0">
        <Icon size={20} aria-hidden />
      </span>
      <p className="text-[15px]">{text}</p>
    </div>
  )
}

/** Monogram tile — the editorial answer to a missing photo. */
export function MonogramTile({ name, className }: { name: string; className?: string }) {
  return (
    <div className={cn('relative grid place-items-center overflow-hidden bg-navy-deep', className)} aria-hidden>
      <div
        className="absolute right-0 top-0 size-[220px] translate-x-1/3 -translate-y-1/3 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(196,106,74,.3), transparent 68%)' }}
      />
      <span className="font-expanded text-[84px] font-black text-white/10">{name.charAt(0)}</span>
    </div>
  )
}
