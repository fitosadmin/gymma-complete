import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn'

/*
 * Sticky in-page wayfinding — the page's single glass surface (D8.16).
 * Scrollspy via IntersectionObserver; the copper underline slides to
 * the act being read.
 */

export interface NavChip {
  id: string
  label: string
}

export function GymNav({ chips }: { chips: NavChip[] }) {
  const [active, setActive] = useState(chips[0]?.id)
  const railRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id)
        }
      },
      { rootMargin: '-30% 0px -60% 0px' },
    )
    chips.forEach((c) => {
      const el = document.getElementById(c.id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [chips])

  // keep the active chip visible inside the rail on small screens
  useEffect(() => {
    const btn = railRef.current?.querySelector<HTMLElement>(`[data-chip="${active}"]`)
    btn?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [active])

  return (
    <nav
      ref={railRef}
      aria-label="Gym page sections"
      className="sticky top-0 z-30 overflow-x-auto border-b border-line bg-paper/88 backdrop-blur-[12px] [scrollbar-width:none]"
    >
      <div className="mx-auto flex w-max min-w-full max-w-[1296px] gap-1 px-5 md:justify-center md:px-10">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            data-chip={c.id}
            aria-current={active === c.id ? 'true' : undefined}
            onClick={() => document.getElementById(c.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className={cn(
              'relative shrink-0 px-4 py-3.5 text-[13.5px] font-semibold transition-colors duration-(--t-fast)',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-inset',
              active === c.id ? 'text-copper-dark' : 'text-muted hover:text-ink',
            )}
          >
            {c.label}
            <span
              aria-hidden
              className={cn(
                'absolute inset-x-3 bottom-0 h-[2px] origin-left rounded-pill bg-copper transition-transform duration-(--t-base) ease-out-soft',
                active === c.id ? 'scale-x-100' : 'scale-x-0',
              )}
            />
          </button>
        ))}
      </div>
    </nav>
  )
}
