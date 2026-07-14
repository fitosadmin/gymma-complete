import { useRef, useState } from 'react'
import { m, useMotionValueEvent, useScroll } from 'framer-motion'
import { Apple, Bell, Dumbbell, TrendingUp } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Eyebrow } from '../../components/ui'
import { APP_SCREENS, PhoneFrame } from '../PhoneFrame'
import { useDesktopStory } from '../useDesktopStory'

/** Act 6 — the branded member app, felt from the member's side. The site's one long pin. */
export function MemberApp() {
  const desktop = useDesktopStory()
  return desktop ? <MemberAppPinned /> : <MemberAppStatic />
}

function MemberAppPinned() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [active, setActive] = useState(0)

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setActive(Math.min(APP_SCREENS.length - 1, Math.floor(v * APP_SCREENS.length * 1.04)))
  })

  return (
    <div ref={ref} className="relative h-[380vh] bg-paper">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1296px] items-center gap-20 px-10 lg:grid-cols-2 xl:px-12">
          <div>
            <Eyebrow>05 · For members</Eyebrow>
            <h2 className="mt-3 text-h2 text-navy">Your gym, in your pocket.</h2>
            <ul className="mt-10 space-y-7">
              {APP_SCREENS.map((s, i) => (
                <li
                  key={s.key}
                  className={cn(
                    'border-l-2 pl-5 transition-all duration-(--t-slow) ease-out-soft',
                    i === active ? 'scale-[1.02] border-copper opacity-100' : 'border-line opacity-40',
                  )}
                >
                  <h3 className="text-h3 text-ink">{s.label}</h3>
                  <p className="mt-1 max-w-[44ch] text-[14.5px] leading-relaxed text-muted">{s.desc}</p>
                </li>
              ))}
            </ul>
            <p className="mt-10 max-w-[46ch] text-[14px] font-semibold text-copper-dark">
              Every gym's app carries its own name, logo, and colors — powered by Gymma underneath.
            </p>
          </div>
          <div className="flex justify-center">
            <PhoneFrame>
              {APP_SCREENS.map((s, i) => (
                <div
                  key={s.key}
                  className={cn(
                    'absolute inset-0 transition-opacity duration-(--t-slow) ease-in-out-smooth',
                    i === active ? 'opacity-100' : 'opacity-0',
                  )}
                  aria-hidden={i !== active}
                >
                  <s.Screen />
                </div>
              ))}
            </PhoneFrame>
          </div>
        </div>
      </div>
    </div>
  )
}

const ICONS = [Dumbbell, Apple, Bell, TrendingUp]

function MemberAppStatic() {
  return (
    <section className="bg-paper py-16 md:py-24">
      <div className="mx-auto max-w-[1296px] px-5 lg:px-10">
        <Eyebrow>05 · For members</Eyebrow>
        <h2 className="mt-3 text-h2 text-navy">Your gym, in your pocket.</h2>
        <div className="mt-8 flex justify-center">
          <PhoneFrame className="w-[240px]">
            <APP_SCREENS0 />
          </PhoneFrame>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {APP_SCREENS.map((s, i) => {
            const Icon = ICONS[i]
            return (
              <m.li
                key={s.key}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35, delay: (i % 2) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="flex gap-4 rounded-md border border-line bg-card p-5"
              >
                <span className="icon-tile shrink-0 !size-11">
                  <Icon size={19} aria-hidden />
                </span>
                <div>
                  <h3 className="font-display text-[15.5px] font-bold text-ink">{s.label}</h3>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{s.desc}</p>
                </div>
              </m.li>
            )
          })}
        </ul>
        <p className="mt-8 text-center text-[13.5px] font-semibold text-copper-dark">
          Every gym's app carries its own name, logo, and colors — powered by Gymma underneath.
        </p>
      </div>
    </section>
  )
}

function APP_SCREENS0() {
  const Screen = APP_SCREENS[0].Screen
  return <Screen />
}
