import type { HTMLAttributes } from 'react'
import { ShieldCheck } from 'lucide-react'
import { cn } from '../../lib/cn'

/* ============================================================
   D8.8 badges
   ============================================================ */

/* --- Tier badges: engraved plaque, copper richness ascending A → Elite --- */
export type Tier = 'A' | 'AA' | 'AAA' | 'Elite'

interface TierBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tier: Tier
  /** sm 24px (cards) · md 32px (heroes) · lg 64px (tier showcase) */
  size?: 'sm' | 'md' | 'lg'
}

const tierText: Record<Tier, string> = {
  A: 'text-copper-dark',
  AA: 'text-copper',
  AAA: 'text-gradient-copper',
  Elite: 'text-gradient-copper',
}

const tierSize = {
  sm: 'h-6 px-2.5 text-[11px]',
  md: 'h-8 px-3.5 text-[13px]',
  lg: 'h-16 px-7 text-[24px]',
}

export function TierBadge({ tier, size = 'md', className, ...props }: TierBadgeProps) {
  /* gradient text uses background-clip:text, which would erase the plaque's
     own background if applied to the same element — so the wordmark gets
     its own inner span */
  const plaque = (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-[10px] bg-navy-raised',
        tier !== 'Elite' && 'border border-copper/20',
        tierSize[size],
        tier !== 'Elite' && className,
      )}
      {...(tier !== 'Elite' ? props : {})}
    >
      <span className={cn('font-expanded font-black uppercase tracking-[0.08em] leading-none', tierText[tier])}>
        GYMM-{tier === 'Elite' ? 'ELITE' : tier}
      </span>
    </span>
  )

  if (tier !== 'Elite') return plaque

  /* Elite: faint animated conic-gradient border (8s loop, D3 H4) */
  return (
    <span
      className={cn('relative inline-flex overflow-hidden rounded-[11px] p-px', className)}
      {...props}
    >
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 aspect-square w-[220%] -translate-x-1/2 -translate-y-1/2 animate-elite-border"
        style={{
          background:
            'conic-gradient(from 0deg, rgba(196,106,74,.7), rgba(217,141,106,.15), rgba(196,106,74,.7))',
        }}
      />
      <span className="relative">{plaque}</span>
    </span>
  )
}

/* --- Verified Member badge: copper check-shield + 12px Archivo 800 --- */
export function VerifiedBadge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-display text-[12px] font-extrabold text-copper',
        className,
      )}
      {...props}
    >
      <ShieldCheck size={14} aria-hidden />
      Verified Member
    </span>
  )
}

/* --- Status badges: Open / Closed / POPULAR --- */
type Status = 'open' | 'closed' | 'popular'

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: Status
}

const statusStyles: Record<Status, string> = {
  open: 'bg-success/10 text-success',
  closed: 'bg-muted/12 text-muted',
  popular: 'bg-gradient-brand text-white',
}

const statusLabel: Record<Status, string> = {
  open: 'Open now',
  closed: 'Closed',
  popular: 'Popular',
}

export function StatusBadge({ status, className, children, ...props }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-pill px-3 font-display text-[11px] font-extrabold uppercase tracking-[0.08em]',
        statusStyles[status],
        className,
      )}
      {...props}
    >
      {children ?? statusLabel[status]}
    </span>
  )
}
