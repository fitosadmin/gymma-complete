import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

/** Eyebrow label — Archivo 800, 12px, 3.5px tracking, uppercase, copper (D8.2). */
export function Eyebrow({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('eyebrow', className)} {...props} />
}
