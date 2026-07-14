import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { m, useMotionValue, useSpring } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { dur } from '../../lib/motion'
import { PhoneFrame, ScreenWorkout } from '../PhoneFrame'
import { useDesktopStory } from '../useDesktopStory'

const lineReveal = (delay: number) => ({
  initial: { y: '110%' },
  animate: { y: '0%' },
  transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
})

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: dur.slow, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
})

/** Act 1 — answer "what is this?" in three seconds, split the two audiences. */
export function Hero() {
  const desktop = useDesktopStory()
  const heroRef = useRef<HTMLElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const px = useSpring(mx, { stiffness: 60, damping: 20 })
  const py = useSpring(my, { stiffness: 60, damping: 20 })

  function onMouseMove(e: React.MouseEvent) {
    if (!desktop || !heroRef.current) return
    const r = heroRef.current.getBoundingClientRect()
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 12)
    my.set(((e.clientY - r.top) / r.height - 0.5) * 12)
  }

  return (
    <section
      id="top"
      ref={heroRef}
      onMouseMove={onMouseMove}
      className="relative flex min-h-[92svh] items-center overflow-hidden bg-paper pt-[72px] max-md:pt-[60px]"
    >
      {/* copper ambience + oversized watermark */}
      <div
        aria-hidden
        className="animate-glow-drift absolute left-[8%] top-[12%] size-[560px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(196,106,74,.14), transparent 70%)' }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-16 select-none font-expanded text-[340px] font-black leading-none text-navy/[.03]"
      >
        GM
      </span>

      <div className="relative mx-auto grid w-full max-w-[1296px] items-center gap-14 px-5 py-16 lg:grid-cols-12 lg:px-10 xl:px-12">
        <div className="lg:col-span-7">
          <m.p className="eyebrow" {...fadeUp(0.05)}>
            India's gym trust platform
          </m.p>

          <h1 className="mt-5 text-display-xl text-navy">
            <span className="block overflow-hidden pb-1">
              <m.span className="block" {...lineReveal(0.12)}>Where every</m.span>
            </span>
            <span className="block overflow-hidden pb-1">
              <m.span className="block" {...lineReveal(0.2)}>
                rep builds <span className="text-gradient-brand">trust.</span>
              </m.span>
            </span>
          </h1>

          <m.p className="mt-6 max-w-[56ch] text-body-l text-muted" {...fadeUp(0.42)}>
            Gymma gives every gym its own premium page, its own branded member app, and ratings
            that only real, paying members can write.
          </m.p>

          <m.div className="mt-9 flex flex-wrap gap-4 max-md:flex-col" {...fadeUp(0.52)}>
            <a
              href="#gyms"
              className="inline-flex min-h-[52px] items-center justify-center rounded-sm bg-copper px-8 font-display text-[15px] font-extrabold tracking-[1px] text-white transition-all duration-(--t-fast) hover:-translate-y-0.5 hover:bg-copper-soft hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              Find a gym near you
            </a>
            <Link
              to="/partner/start"
              className="inline-flex min-h-[52px] items-center justify-center rounded-sm border-[1.5px] border-navy px-8 font-display text-[15px] font-extrabold tracking-[1px] text-navy transition-colors duration-(--t-fast) hover:bg-navy/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              Get your gym on Gymma
            </Link>
          </m.div>

          <m.p className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-muted" {...fadeUp(0.62)}>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-copper" aria-hidden /> Verified member reviews
            </span>
            <span aria-hidden className="text-line">·</span>
            <span>Live in 48 hours</span>
            <span aria-hidden className="text-line">·</span>
            <span>Made for India</span>
          </m.p>
        </div>

        {/* the product, floating — not a screenshot, the real design system */}
        <m.div
          className="hidden justify-center lg:col-span-5 lg:flex"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur.story, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <m.div style={{ x: px, y: py, rotate: 8 }}>
            <PhoneFrame>
              <ScreenWorkout />
            </PhoneFrame>
          </m.div>
        </m.div>
      </div>
    </section>
  )
}
