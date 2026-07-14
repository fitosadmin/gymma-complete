import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { m } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { cn } from '../lib/cn'

const LINKS = [
  { label: 'Find a Gym', href: '#gyms' },
  { label: 'For Gym Owners', href: '#owners' },
  { label: 'Pricing', href: '#pricing' },
]

/** Global nav — transparent over the hero, the system's ONE glass surface after 80px (D8.16). */
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // plain state set — identical booleans skip re-render, so no rAF throttle
    // needed (and rAF stalls in occluded tabs)
    const onScroll = () => setScrolled(window.scrollY > 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-(--t-base)',
          scrolled ? 'border-b border-line bg-paper/88 backdrop-blur-[12px]' : 'border-b border-transparent',
        )}
      >
        <div className="mx-auto flex h-[72px] max-w-[1296px] items-center gap-8 px-5 lg:px-10 xl:px-12 max-md:h-[60px]">
          <a
            href="#top"
            className="rounded-[4px] px-1 font-expanded text-[19px] font-black tracking-wide text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
          >
            GYMMA
          </a>
          <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-[4px] px-0.5 text-[14px] font-semibold text-ink transition-colors duration-(--t-fast) hover:text-copper-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto hidden md:block">
            <Link
              to="/partner/start"
              className="inline-flex items-center rounded-sm bg-copper px-6 py-3 font-display text-[14px] font-extrabold tracking-[1px] text-white transition-all duration-(--t-fast) hover:-translate-y-0.5 hover:bg-copper-soft hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              Get your gym on Gymma
            </Link>
          </div>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="ml-auto grid size-11 place-items-center rounded-full text-navy md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
          >
            <Menu size={22} aria-hidden />
          </button>
        </div>
      </header>

      {/* mobile menu — full-screen navy overlay, enter-only (occluded-tab rule) */}
      {open && (
        <m.div
          className="fixed inset-0 z-50 flex flex-col bg-navy-deep md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex h-[60px] items-center justify-between px-5">
            <span className="font-expanded text-[19px] font-black tracking-wide text-dark-1">GYMMA</span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="grid size-11 place-items-center rounded-full text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
            >
              <X size={22} aria-hidden />
            </button>
          </div>
          <nav aria-label="Primary" className="flex flex-1 flex-col justify-center gap-2 px-8">
            {LINKS.map((l, i) => (
              <m.a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.04, duration: 0.3 }}
                className="rounded-[6px] py-3 font-display text-[28px] font-extrabold text-dark-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
              >
                {l.label}
              </m.a>
            ))}
          </nav>
          <div className="px-8 pb-10">
            <Link
              to="/partner/start"
              onClick={() => setOpen(false)}
              className="flex min-h-[52px] w-full items-center justify-center rounded-sm bg-copper font-display text-[15px] font-extrabold tracking-[1px] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
            >
              Get your gym on Gymma
            </Link>
          </div>
        </m.div>
      )}
    </>
  )
}
