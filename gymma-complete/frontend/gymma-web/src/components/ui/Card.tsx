import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export type CardVariant = 'default' | 'dark' | 'featured' | 'ghost'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  /** Only interactive cards get the hover lift (D8.6) */
  interactive?: boolean
}

/*
 * D8.6 cards: white, 1px line, radius 20, shadow-sm, padding 24–30.
 * dark = navy-raised + copper-alpha border · featured = 2px copper (POPULAR)
 * · ghost = dashed ("Your gym could be here").
 */
const variants: Record<CardVariant, string> = {
  default: 'bg-card border border-line shadow-sm',
  dark: 'bg-navy-raised border border-copper/20 text-dark-2',
  featured: 'bg-card border-2 border-copper shadow-sm',
  ghost: 'bg-transparent border border-dashed border-line',
}

export function Card({ variant = 'default', interactive = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-md p-6 md:p-7',
        variants[variant],
        interactive &&
          'transition-all duration-(--t-base) ease-out-soft hover:-translate-y-1 hover:shadow-md',
        className,
      )}
      {...props}
    />
  )
}
