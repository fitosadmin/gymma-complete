import { Check } from 'lucide-react'
import { cn } from '../lib/cn'
import { encouragement, remainingLabel } from './completion'

/* Reusable premium progress strip: step dots (completed / current /
   upcoming), journey %, time remaining, and an encouraging message
   driven by website completeness. Rewarding, not mechanical. */

interface WizardProgressProps {
  /** Step labels, index-aligned with the wizard (index 0 = welcome). */
  labels: string[]
  current: number
  /** Highest step the owner has reached — earlier steps are re-clickable. */
  maxVisited: number
  /** 0–100 website content-completeness score. */
  completion: number
  onJump: (step: number) => void
}

export function WizardProgress({ labels, current, maxVisited, completion, onJump }: WizardProgressProps) {
  const last = labels.length - 1
  const pct = Math.round((current / last) * 100)

  return (
    <div className="border-b border-line bg-paper px-4 py-2.5 md:px-6">
      <div className="flex items-center gap-4">
        {/* step dots */}
        <ol className="hidden items-center gap-1.5 md:flex" aria-label="Wizard steps">
          {labels.slice(1).map((label, i) => {
            const step = i + 1
            const done = step < current
            const isCurrent = step === current
            const reachable = step <= maxVisited
            return (
              <li key={label}>
                <button
                  type="button"
                  title={`${label}${done ? ' — done' : ''}`}
                  aria-label={`Step ${step}: ${label}${done ? ', completed' : ''}`}
                  aria-current={isCurrent ? 'step' : undefined}
                  disabled={!reachable || isCurrent}
                  onClick={() => onJump(step)}
                  className={cn(
                    'grid size-5 place-items-center rounded-full transition-all duration-(--t-base) ease-out-soft',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2',
                    done && 'bg-copper text-white hover:bg-copper-dark',
                    isCurrent && 'scale-110 border-2 border-copper bg-white',
                    !done && !isCurrent && (reachable ? 'bg-line hover:bg-muted/40' : 'bg-line opacity-60'),
                  )}
                >
                  {done && <Check size={11} strokeWidth={3} aria-hidden className="animate-pop" />}
                </button>
              </li>
            )
          })}
        </ol>

        <p className="min-w-0 flex-1 truncate text-[12.5px] text-muted" aria-live="polite">
          {encouragement(completion)}
        </p>

        <p className="shrink-0 text-[12.5px] text-muted">
          <span className="font-display font-extrabold text-ink">{pct}%</span>
          <span className="hidden sm:inline"> · step {current} of {last}</span> · {remainingLabel(current)}
        </p>
      </div>

      {/* the bar — brand gradient, springy fill */}
      <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-line">
        <div
          className="h-full rounded-pill bg-gradient-brand transition-[width] duration-(--t-slow) ease-in-out-smooth"
          style={{ width: `${Math.max(3, pct)}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Wizard progress"
        />
      </div>
    </div>
  )
}
