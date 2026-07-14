import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '../lib/cn'

/* The multi-stage publish moment — theatre with the brand's restraint.
   Stages tick through with check morphs; the copper bar carries tension. */

const STAGES = [
  'Publishing your website…',
  'Generating your public page…',
  'Preparing your gallery…',
  'Generating your QR code…',
  'Final quality check…',
]

const STAGE_MS = [900, 850, 800, 750, 700]

export function PublishingOverlay({ gymName, onDone }: { gymName: string; onDone: () => void }) {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (stage >= STAGES.length) {
      const t = window.setTimeout(onDone, reduced ? 50 : 400)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => setStage((s) => s + 1), reduced ? 120 : STAGE_MS[stage])
    return () => window.clearTimeout(t)
  }, [stage, onDone])

  const pct = Math.min(100, Math.round((stage / STAGES.length) * 100))

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-deep" role="status" aria-live="polite">
      <div aria-hidden className="copper-glow fixed right-0 top-0 translate-x-1/3 -translate-y-1/3" />
      <div className="relative mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-16">
        <p className="font-expanded text-[18px] font-black tracking-wide text-dark-1">GYMMA</p>
        <h1 className="mt-3 text-h2 text-dark-1">Putting {gymName} on the map</h1>

        <ol className="mt-8 space-y-4">
          {STAGES.map((label, i) => {
            const done = i < stage
            const active = i === stage
            return (
              <li
                key={label}
                className={cn(
                  'flex items-center gap-3 transition-opacity duration-(--t-base)',
                  !done && !active && 'opacity-35',
                )}
              >
                <span
                  className={cn(
                    'grid size-7 shrink-0 place-items-center rounded-full border transition-colors duration-(--t-base)',
                    done && 'border-copper bg-copper text-white',
                    active && 'border-copper/60 text-copper',
                    !done && !active && 'border-dark-3/40 text-dark-3',
                  )}
                >
                  {done ? (
                    <Check size={14} strokeWidth={3} aria-hidden className="animate-pop" />
                  ) : active ? (
                    <Loader2 size={14} aria-hidden className="animate-spin" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-current" aria-hidden />
                  )}
                </span>
                <span className={cn('text-[15px]', done ? 'text-dark-2' : active ? 'font-semibold text-dark-1' : 'text-dark-3')}>
                  {label}
                </span>
              </li>
            )
          })}
        </ol>

        <div className="mt-10 h-1.5 overflow-hidden rounded-pill bg-navy-raised">
          <div
            className="h-full rounded-pill bg-gradient-brand transition-[width] duration-(--t-slow) ease-in-out-smooth"
            style={{ width: `${Math.max(6, pct)}%` }}
          />
        </div>
        <p className="mt-3 text-caption text-dark-3">This takes a few seconds — worth every one of them.</p>
      </div>
    </div>
  )
}
