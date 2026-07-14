import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Skeletons appear only after 300ms so fast loads never flash (D8.22).
   * Pass false for skeletons inside already-visible shimmering groups.
   */
  delayed?: boolean
}

/*
 * D8.22: geometry-true blocks in #f1ede8 with a 1.2s shimmer sweep.
 * Keep ONE shimmer region per viewport — compose multiple Skeletons
 * inside a single parent and give only the parent `shimmer`.
 */
export function Skeleton({ delayed = true, className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'relative overflow-hidden rounded-md bg-skeleton',
        delayed && 'opacity-0 animate-skeleton-in',
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
    </div>
  )
}
