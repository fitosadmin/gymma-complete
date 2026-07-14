import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

export type ButtonVariant =
  | 'primary'        /* copper bg, white text */
  | 'on-dark'        /* white bg, navy text — poster CTA button */
  | 'secondary'      /* 1.5px navy outline */
  | 'tertiary'       /* copper text link + sliding arrow */
  | 'destructive'    /* builder only */

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
  /** Full-width 52px-tall mobile CTA treatment (D5) */
  block?: boolean
  children: ReactNode
}

/*
 * D8.5 button spec. All six D8.20 states:
 * default · hover · focus-visible (copper ring) · active (scale .98)
 * · disabled (40%, no pointer) · loading (in-place spinner, width locked).
 */
const base = cn(
  'relative inline-flex items-center justify-center gap-2 select-none',
  'font-display font-extrabold text-[15px] tracking-[1px]',
  'transition-all duration-(--t-fast) ease-out-soft',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2',
  'active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none',
)

const solid = 'rounded-sm px-8 py-4'

const variants: Record<ButtonVariant, string> = {
  primary: cn(solid, 'bg-copper text-white hover:bg-copper-soft hover:-translate-y-0.5 hover:shadow-md'),
  'on-dark': cn(solid, 'bg-white text-navy hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-offset-navy-deep'),
  secondary: cn(solid, 'border-[1.5px] border-navy text-navy bg-transparent hover:bg-navy/5'),
  destructive: cn(solid, 'bg-error text-white hover:-translate-y-0.5 hover:shadow-md'),
  tertiary: cn(
    'group text-copper rounded-[4px] px-1 py-1',
    'after:absolute after:left-1 after:right-1 after:bottom-0 after:h-[2px] after:origin-left after:scale-x-0',
    'after:bg-copper after:transition-transform after:duration-(--t-base) after:ease-out-soft',
    'hover:after:scale-x-100 focus-visible:after:scale-x-100 focus-visible:ring-offset-0',
  ),
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', loading = false, block = false, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], block && 'w-full min-h-[52px]', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {/* width stays locked while loading: label goes invisible, spinner overlays */}
      <span className={cn('inline-flex items-center gap-2', loading && 'invisible')}>
        {children}
        {variant === 'tertiary' && (
          <ArrowRight
            aria-hidden
            size={16}
            className="transition-transform duration-(--t-base) ease-out-soft group-hover:translate-x-1"
          />
        )}
      </span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Loader2 aria-hidden size={18} className="animate-spin" />
        </span>
      )}
    </button>
  )
})
