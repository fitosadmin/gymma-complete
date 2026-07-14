import { useRef, useState } from 'react'
import { m, useMotionValueEvent, useScroll } from 'framer-motion'
import { cn } from '../../lib/cn'
import { Eyebrow } from '../../components/ui'
import { CountUp } from '../CountUp'
import { useDesktopStory } from '../useDesktopStory'

const BEATS = [
  <>…but <strong className="text-white">never once for your gym.</strong></>,
  <>Workout plans live in notebooks. Nutrition? <strong className="text-white">Forgotten by Tuesday.</strong></>,
  <>Announcements die in a <strong className="text-white">200-message WhatsApp group.</strong></>,
  <>And choosing a gym? A 12-month contract signed on <strong className="text-white">word-of-mouth and strangers' stars.</strong></>,
]

/** Act 2 (dark) — the villain. Desktop pins for 2 viewport-heights and scrubs the beats. */
export function Problem() {
  const desktop = useDesktopStory()
  return desktop ? <ProblemPinned /> : <ProblemStatic />
}

function ProblemPinned() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [active, setActive] = useState(0)
  const [count, setCount] = useState(0)

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setActive(Math.min(BEATS.length - 1, Math.floor(v * (BEATS.length + 0.4))))
    setCount(Math.round(Math.min(1, v * 3.2) * 96))
  })

  return (
    <div ref={ref} className="relative h-[300vh] bg-navy-deep">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div aria-hidden className="copper-glow absolute right-0 top-0 translate-x-1/3 -translate-y-1/3" />
        <div className="relative mx-auto grid w-full max-w-[1296px] items-center gap-16 px-10 lg:grid-cols-[380px_1fr] xl:px-12">
          <div>
            <Eyebrow>01 · The problem</Eyebrow>
            <p className="mt-4 text-display-xl text-gradient-copper" aria-hidden>
              {count}×
            </p>
            <p className="sr-only">96 times</p>
            <p className="mt-2 text-h3 text-dark-1">
              phone checks, every single day
            </p>
          </div>
          <ul className="space-y-7">
            {BEATS.map((beat, i) => (
              <li
                key={i}
                className={cn(
                  'max-w-[46ch] text-[22px] leading-relaxed text-dark-2 transition-all duration-(--t-slow) ease-out-soft',
                  i === active ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-30',
                )}
              >
                {beat}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function ProblemStatic() {
  return (
    <section className="relative overflow-hidden bg-navy-deep py-16 md:py-24">
      <div aria-hidden className="copper-glow absolute right-0 top-0 translate-x-1/3 -translate-y-1/3" />
      <div className="relative mx-auto max-w-[1296px] px-5 lg:px-10">
        <Eyebrow>01 · The problem</Eyebrow>
        <p className="mt-4 font-expanded text-[88px] font-black leading-none text-gradient-copper">
          <CountUp to={96} />×
        </p>
        <p className="mt-2 text-h3 text-dark-1">phone checks, every single day</p>
        <ul className="mt-8 space-y-5">
          {BEATS.map((beat, i) => (
            <m.li
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[46ch] text-[17px] leading-relaxed text-dark-2"
            >
              {beat}
            </m.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
