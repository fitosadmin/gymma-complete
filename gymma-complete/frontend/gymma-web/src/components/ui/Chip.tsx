import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  /** Filter chips get a count suffix (D8.9) */
  count?: number
}

/* D8.9 tags/chips: pill radius-100, 13px, 1px line border; selected = navy bg white text. */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { selected = false, count, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={selected}
      className={cn(
        'inline-flex min-h-[36px] items-center gap-1.5 rounded-pill border px-3.5 text-[13px]',
        'transition-colors duration-(--t-fast)',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2',
        'active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none',
        selected
          ? 'border-navy bg-navy text-white'
          : 'border-line bg-white text-ink hover:border-muted/50',
        className,
      )}
      {...props}
    >
      {children}
      {count !== undefined && (
        <span className={cn('text-[12px]', selected ? 'text-dark-3' : 'text-muted')}>{count}</span>
      )}
    </button>
  )
})
