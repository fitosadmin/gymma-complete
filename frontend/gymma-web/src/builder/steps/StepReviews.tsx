import { ShieldCheck, Star } from 'lucide-react'
import { VerifiedBadge } from '../../components/ui'
import { useBuilder } from '../store'
import { StepShell } from './shared'

export function StepReviews() {
  const { draft } = useBuilder()
  const name = draft.basics.name || 'your gym'

  return (
    <StepShell
      step="Step 9 · Verified reviews"
      title="Reviews you'll never have to fake"
      sub="Nothing to set up here — this section builds itself, honestly."
    >
      <div className="rounded-md border border-line bg-card p-6">
        <p className="text-[15px] leading-relaxed text-muted">
          Once you're live, only <strong className="text-ink">real, paying members</strong> of {name} can
          review it — after <strong className="text-ink">14 days of membership</strong> and{' '}
          <strong className="text-ink">5 logged workouts</strong>. Reviews are anonymous forever, so
          feedback is honest, and every one carries the badge:
        </p>
        <div className="mt-4">
          <VerifiedBadge />
        </div>
      </div>

      <div>
        <p className="mb-2 font-display text-[13px] font-bold text-ink">How it will look on your page</p>
        <div className="relative overflow-hidden rounded-md bg-navy-deep p-6">
          <div aria-hidden className="copper-glow absolute right-0 top-0 translate-x-1/2 -translate-y-1/2" />
          <div className="relative rounded-md border border-copper/20 bg-navy-raised p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-display text-[12px] font-extrabold text-copper">
                <ShieldCheck size={14} aria-hidden /> Verified Member
              </span>
              <span className="text-caption text-dark-3">March 2027</span>
            </div>
            <div className="mt-3 flex gap-1 text-copper">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} fill="currentColor" aria-hidden />
              ))}
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-dark-2">
              "Clean floors, maintained equipment, coaches who actually coach. Exactly what the photos promised."
            </p>
          </div>
          <p className="relative mt-3 text-center text-caption text-dark-3">
            Placeholder preview — your first real review replaces this automatically.
          </p>
        </div>
      </div>
    </StepShell>
  )
}
