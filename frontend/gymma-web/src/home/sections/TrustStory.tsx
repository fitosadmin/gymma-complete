import { m } from 'framer-motion'
import { CalendarCheck, KeyRound, MessageSquareLock, Star } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Container, Eyebrow, Section, VerifiedBadge } from '../../components/ui'
import { cn } from '../../lib/cn'

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: KeyRound, title: 'Join a gym', body: 'A member gets app credentials from their own gym — nobody else can.' },
  { icon: CalendarCheck, title: 'Actually train', body: '14 days of membership and 5 logged workouts before the pen unlocks.' },
  { icon: MessageSquareLock, title: 'Review, anonymously', body: 'One review per 90 days. Identity protected from the gym — and from us.' },
  { icon: Star, title: 'Trust, published', body: 'Six dimensions, Bayesian-weighted, badged. Impossible to fake.' },
]

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 20, scale: 0.94 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: true, amount: 0.4 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
})

/** Act 3 — the moat, explained with total clarity. */
export function TrustStory() {
  return (
    <Section tone="paper">
      <Container>
        <Eyebrow>02 · The Gymma idea</Eyebrow>
        <h2 className="mt-3 max-w-[22ch] text-h2 text-navy">What if every rating had to be earned?</h2>
        <p className="mt-4 max-w-[58ch] text-body-l text-muted">
          On Gymma, a review can only come from a real, paying member of that gym.
          No competitors. No bots. No strangers.
        </p>

        {/* the mechanic — copper thread drawing through four earned steps */}
        <div className="relative mt-14">
          <svg
            aria-hidden
            className="absolute left-[28px] top-7 hidden h-[2px] w-[calc(100%-56px)] overflow-visible lg:block"
            preserveAspectRatio="none"
            viewBox="0 0 100 1"
          >
            <m.line
              x1="0"
              y1="0.5"
              x2="100"
              y2="0.5"
              stroke="url(#thread)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1] }}
            />
            <defs>
              <linearGradient id="thread" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#d98d6a" />
                <stop offset="1" stopColor="#9c4f33" />
              </linearGradient>
            </defs>
          </svg>
          {/* mobile vertical thread */}
          <div aria-hidden className="absolute bottom-6 left-[27px] top-7 w-[2px] bg-gradient-to-b from-copper-soft to-copper-dark lg:hidden" />

          <ol className="relative grid gap-10 lg:grid-cols-4 lg:gap-6">
            {STEPS.map((s, i) => (
              <m.li key={s.title} className="flex gap-5 lg:block" {...rise(0.2 + i * 0.28)}>
                <span
                  className={cn(
                    'relative z-10 grid size-14 shrink-0 place-items-center rounded-full bg-gradient-brand text-white shadow-lg',
                  )}
                >
                  <s.icon size={22} aria-hidden />
                </span>
                <div className="lg:mt-5">
                  <p className="font-display text-[12px] font-extrabold uppercase tracking-wider text-copper-dark">
                    Step {i + 1}
                  </p>
                  <h3 className="mt-1 text-h3 text-ink">{s.title}</h3>
                  <p className="mt-1.5 max-w-[30ch] text-[14.5px] leading-relaxed text-muted">{s.body}</p>
                </div>
              </m.li>
            ))}
          </ol>
        </div>

        {/* the payoff — an actual review card, exactly as it ships */}
        <m.div
          className="mt-14 grid items-center gap-8 lg:grid-cols-[1fr_420px]"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="max-w-[44ch] font-display text-[20px] font-bold leading-snug text-navy">
            Anonymous to gyms. Anonymous to us.{' '}
            <span className="text-gradient-copper">Verified to everyone.</span>
          </p>
          <div className="rounded-md border border-line bg-card p-6 shadow-md">
            <div className="flex items-center justify-between">
              <VerifiedBadge />
              <span className="text-caption text-muted">March 2026</span>
            </div>
            <div className="mt-3 flex gap-1 text-copper">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={15} fill={i < 5 ? 'currentColor' : 'none'} aria-hidden />
              ))}
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-ink">
              "Cleanest gym I've trained at in Indiranagar. Equipment is genuinely maintained and
              the 6am crowd is a family."
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {[['Cleanliness', '4.9'], ['Equipment', '4.7'], ['Staff', '4.8']].map(([k, v]) => (
                <span key={k} className="rounded-pill border border-line px-2.5 py-0.5 text-[11.5px] text-muted">
                  {k} <strong className="text-copper-dark">{v}</strong>
                </span>
              ))}
            </div>
          </div>
        </m.div>
      </Container>
    </Section>
  )
}
