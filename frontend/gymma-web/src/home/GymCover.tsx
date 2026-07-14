import { cn } from '../lib/cn'

/*
 * Art-directed procedural gym covers — navy field, copper light,
 * oversized monogram. No stock photos, no off-brand pixels; every
 * demo card looks deliberately lit rather than placeholder-grey.
 */

const COMPOSITIONS = [
  { glow: 'right-0 top-0 translate-x-1/3 -translate-y-1/3', letter: '-right-6 -bottom-14' },
  { glow: 'left-0 bottom-0 -translate-x-1/3 translate-y-1/3', letter: '-left-4 -top-12' },
  { glow: 'right-0 bottom-0 translate-x-1/4 translate-y-1/4', letter: '-left-6 -bottom-16' },
]

export function GymCover({ seed, initial, className }: { seed: number; initial: string; className?: string }) {
  const c = COMPOSITIONS[seed % COMPOSITIONS.length]
  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-navy-deep', className)} aria-hidden>
      <div
        className={cn('absolute size-[420px] rounded-full', c.glow)}
        style={{ background: 'radial-gradient(circle, rgba(196,106,74,.32), transparent 68%)' }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(160deg, rgba(31,45,61,.0) 30%, rgba(20,31,43,.55) 100%)' }}
      />
      <span
        className={cn(
          'absolute select-none font-expanded font-black leading-none text-white/[.07]',
          'text-[200px]',
          c.letter,
        )}
      >
        {initial}
      </span>
    </div>
  )
}
