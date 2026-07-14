import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { m } from 'framer-motion'
import { ArrowRight, MapPin, ShieldCheck, Star } from 'lucide-react'
import { Container, Eyebrow, Section, TierBadge } from '../../components/ui'
import { GymCover } from '../GymCover'
import { DEMO_GYMS } from '../demoGyms'
import type { DemoGym } from '../demoGyms'
import { useDesktopStory } from '../useDesktopStory'

/** Act 5 — proof beats promises. Real cards, and the signature zoom-in transition. */
export function FeaturedGyms() {
  const navigate = useNavigate()
  const desktop = useDesktopStory()
  const [expanding, setExpanding] = useState<{ gym: DemoGym; rect: DOMRect } | null>(null)

  function open(gym: DemoGym, el: HTMLElement) {
    if (!desktop) {
      navigate(`/gym/${gym.slug}`)
      return
    }
    setExpanding({ gym, rect: el.getBoundingClientRect() })
  }

  // navigation must never depend on an animation frame firing — if the
  // expand animation stalls for any reason, this timer completes the trip
  useEffect(() => {
    if (!expanding) return
    const t = window.setTimeout(() => navigate(`/gym/${expanding.gym.slug}`), 650)
    return () => window.clearTimeout(t)
  }, [expanding, navigate])

  return (
    <Section tone="paper" id="gyms" className="scroll-mt-16">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow>04 · For gym seekers</Eyebrow>
            <h2 className="mt-3 text-h2 text-navy">Know before you join.</h2>
            <p className="mt-3 max-w-[52ch] text-body-l text-muted">
              Verified ratings across six dimensions. Compare gyms side by side. These are live pages —
              step inside one.
            </p>
          </div>
        </div>

        <ul className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 max-lg:-mx-5 max-lg:px-5 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
          {DEMO_GYMS.map((gym, i) => (
            <FeaturedCard key={gym.slug} gym={gym} index={i} onOpen={open} />
          ))}

          {/* ghost card — dual-audience seeding */}
          <m.li
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.35, delay: 0.27, ease: [0.22, 1, 0.36, 1] }}
            className="w-[82vw] shrink-0 snap-center sm:w-[340px] lg:w-auto"
          >
            <Link
              to="/partner/start"
              className="group flex h-full min-h-[300px] flex-col items-center justify-center rounded-md border border-dashed border-line bg-transparent p-6 text-center transition-colors duration-(--t-base) hover:border-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
            >
              <span className="font-expanded text-[40px] font-black text-line transition-colors duration-(--t-base) group-hover:text-copper/50">+</span>
              <p className="mt-2 font-display text-[16px] font-bold text-muted">Your gym could be here</p>
              <p className="mt-1 inline-flex items-center gap-1 text-[13.5px] font-semibold text-copper">
                Get listed <ArrowRight size={13} aria-hidden className="transition-transform duration-(--t-base) group-hover:translate-x-1" />
              </p>
            </Link>
          </m.li>
        </ul>
      </Container>

      {/* the signature move: the card physically becomes the gym page hero */}
      {expanding && (
        <m.div
          className="fixed z-[60] overflow-hidden"
          initial={{
            top: expanding.rect.top,
            left: expanding.rect.left,
            width: expanding.rect.width,
            height: expanding.rect.height,
            borderRadius: 20,
          }}
          animate={{ top: 0, left: 0, width: window.innerWidth, height: Math.max(420, window.innerHeight * 0.55), borderRadius: 0 }}
          transition={{ duration: 0.45, ease: [0.65, 0, 0.35, 1] }}
          onAnimationComplete={() => navigate(`/gym/${expanding.gym.slug}`)}
        >
          <GymCover seed={expanding.gym.seed} initial={expanding.gym.initial} />
          <div className="absolute inset-x-0 bottom-0 p-8">
            <p className="text-display text-white">{expanding.gym.name}</p>
          </div>
        </m.div>
      )}
    </Section>
  )
}

function FeaturedCard({
  gym,
  index,
  onOpen,
}: {
  gym: DemoGym
  index: number
  onOpen: (gym: DemoGym, el: HTMLElement) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <m.li
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.35, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
      className="w-[82vw] shrink-0 snap-center sm:w-[340px] lg:w-auto"
    >
      <button
        type="button"
        onClick={() => ref.current && onOpen(gym, ref.current)}
        aria-label={`${gym.name}, ${gym.area} — GYMM-${gym.tier === 'Elite' ? 'Elite' : gym.tier}, rated ${gym.rating} by ${gym.reviews} verified members. View gym.`}
        className="group block w-full rounded-md text-left transition-transform duration-(--t-base) ease-out-soft hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 active:scale-[0.99]"
      >
        <div className="overflow-hidden rounded-md border border-line bg-card shadow-sm transition-shadow duration-(--t-base) group-hover:shadow-md">
          <div ref={ref} className="relative aspect-[16/10] overflow-hidden">
            <div className="h-full w-full transition-transform duration-(--t-slow) ease-out-soft group-hover:scale-[1.04]">
              <GymCover seed={gym.seed} initial={gym.initial} />
            </div>
            <span className="absolute left-3 top-3">
              <TierBadge tier={gym.tier} size="sm" />
            </span>
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-h3 text-ink">{gym.name}</h3>
                <p className="mt-0.5 flex items-center gap-1 text-[13px] text-muted">
                  <MapPin size={12} aria-hidden className="text-copper" /> {gym.area}, Bengaluru
                </p>
              </div>
              <p className="flex items-center gap-1 font-display text-[15px] font-extrabold text-ink">
                <Star size={14} className="text-copper" fill="currentColor" aria-hidden /> {gym.rating}
              </p>
            </div>
            <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{gym.blurb}</p>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
                <ShieldCheck size={13} className="text-copper" aria-hidden />
                {gym.reviews} verified members
              </p>
              <span className="inline-flex items-center gap-1 text-[13.5px] font-bold text-copper">
                View gym
                <ArrowRight size={13} aria-hidden className="transition-transform duration-(--t-base) group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </div>
      </button>
    </m.li>
  )
}
