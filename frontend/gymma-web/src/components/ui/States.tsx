import type { LucideIcon } from 'lucide-react'
import { Check, CircleAlert, Phone } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Button } from './Button'

/* ============================================================
   D8.21–8.24 designed states — never defaulted, never blaming.
   ============================================================ */

/* --- Empty state: stroke icon + one honest sentence + one recovery action --- */
interface EmptyStateProps {
  icon: LucideIcon
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({ icon: Icon, title, message, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn('mx-auto flex max-w-md flex-col items-center py-12 text-center', className)}>
      <span className="icon-tile mb-5">
        <Icon size={22} strokeWidth={2} aria-hidden />
      </span>
      <h3 className="text-h3 text-ink">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">{message}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

/* --- Error state: retry card + the on-brand call fallback (D8.23) --- */
interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  /** Show the "Or just call us" fallback line for full-route failures */
  callFallback?: boolean
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  callFallback = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'mx-auto flex max-w-md flex-col items-center rounded-md border border-line bg-card p-8 text-center shadow-sm',
        className,
      )}
    >
      <span className="mb-4 inline-flex size-11 items-center justify-center rounded-full bg-error/10 text-error">
        <CircleAlert size={22} aria-hidden />
      </span>
      <h3 className="text-h3 text-ink">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">{message}</p>
      {onRetry && (
        <Button className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      )}
      {callFallback && (
        <a
          href="tel:+919591276584"
          className="mt-4 inline-flex items-center gap-2 text-[14px] font-semibold text-copper hover:text-copper-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 rounded-[4px]"
        >
          <Phone size={15} aria-hidden />
          Or just call us — 95912 76584
        </a>
      )}
    </div>
  )
}

/* --- Success state: always answers "what now?" (D8.24) --- */
interface SuccessStateProps {
  title: string
  message: string
  actionLabel: string
  onAction: () => void
  className?: string
}

export function SuccessState({ title, message, actionLabel, onAction, className }: SuccessStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'mx-auto flex max-w-md flex-col items-center rounded-md border border-line bg-card p-8 text-center shadow-sm',
        className,
      )}
    >
      <span className="mb-4 inline-flex size-11 items-center justify-center rounded-full bg-success/10 text-success">
        <Check size={22} strokeWidth={2.5} aria-hidden />
      </span>
      <h3 className="text-h3 text-ink">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">{message}</p>
      <Button className="mt-6" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  )
}
