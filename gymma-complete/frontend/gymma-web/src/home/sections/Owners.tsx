import { Link } from 'react-router-dom'
import { m } from 'framer-motion'
import { ArrowUpRight, Eye, TrendingUp, Trophy } from 'lucide-react'
import { Container, Eyebrow, Section, TierBadge } from '../../components/ui'
import { CountUp } from '../CountUp'

const DIMENSIONS: [string, number][] = [
  ['Equipment', 4.7],
  ['Cleanliness', 4.9],
  ['Staff', 4.8],
  ['Environment', 4.5],
  ['Value', 4.6],
  ['Safety', 4.8],
]

const CARDS = [
  {
    icon: Eye,
    title: 'See what members really think',
    body: 'Anonymous six-dimension feedback with ranked improvement priorities — no more guessing.',
  },
  {
    icon: TrendingUp,
    title: 'Keep more members',
    body: 'Engagement tools that cut churn. Gyms with digital engagement retain 12–15% more members.',
  },
  {
    icon: Trophy,
    title: 'Win the neighborhood',
    body: 'Your verified GYMM badge works while you sleep — against their generic star ratings.',
  },
]

/** Act 7 — convert Priya: trust → retention → growth, with the dashboard shown, not described. */
export function Owners() {
  return (
    <Section tone="paper" id="owners" className="scroll-mt-16">
      <Container>
        <Eyebrow>06 · For gym owners</Eyebrow>
        <h2 className="mt-3 max-w-[20ch] text-h2 text-navy">
          Stop competing on price. Start competing on trust.
        </h2>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[1fr_440px]">
          <div className="space-y-5">
            {CARDS.map((c, i) => (
              <m.div
                key={c.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                className="flex gap-5 rounded-md border border-line bg-card p-6"
              >
                <span className="icon-tile shrink-0">
                  <c.icon size={20} aria-hidden />
                </span>
                <div>
                  <h3 className="text-h3 text-ink">{c.title}</h3>
                  <p className="mt-1.5 max-w-[52ch] text-[14.5px] leading-relaxed text-muted">{c.body}</p>
                </div>
              </m.div>
            ))}

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-[13.5px] font-semibold text-muted">
              <span>✓ Live in 48 hours</span>
              <span>✓ No setup fees</span>
              <span>✓ 1-month free trial</span>
            </div>

            <Link
              to="/partner/start"
              className="group inline-flex items-center gap-1.5 pt-2 font-display text-[15px] font-extrabold text-copper transition-colors duration-(--t-fast) hover:text-copper-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper rounded-[4px]"
            >
              Partner with Gymma
              <ArrowUpRight size={16} aria-hidden className="transition-transform duration-(--t-base) group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          {/* the owner dashboard — a real analytics panel, not a screenshot */}
          <m.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-lg bg-navy-deep p-6 shadow-lg"
            aria-label="Owner dashboard preview showing verified rating analytics"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-expanded text-[13px] font-black text-dark-1">FIT DISTRICT</p>
                <p className="text-[10.5px] text-dark-3">Owner dashboard · This quarter</p>
              </div>
              <TierBadge tier="AAA" size="sm" />
            </div>

            <div className="mt-5 flex items-end gap-6">
              <div>
                <p className="font-expanded text-[44px] font-black leading-none text-gradient-copper">4.8</p>
                <p className="mt-1 text-[10.5px] text-dark-3">
                  <CountUp to={124} /> verified reviews
                </p>
              </div>
              <div className="flex-1 space-y-2 pb-1">
                {DIMENSIONS.map(([label, score], i) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-[74px] text-[10px] text-dark-3">{label}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-navy-raised">
                      <m.div
                        className="h-full rounded-pill"
                        style={{ background: 'var(--gradient-copper-text)' }}
                        initial={{ scaleX: 0, originX: 0 }}
                        whileInView={{ scaleX: score / 5 }}
                        viewport={{ once: true, amount: 0.6 }}
                        transition={{ duration: 0.6, delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <span className="w-6 text-right text-[10px] font-bold text-dark-2">{score}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-[12px] border border-copper/20 bg-navy-raised p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-copper">Improvement priority</p>
              <p className="mt-1 text-[12px] leading-relaxed text-dark-2">
                Environment scores dip on weekday evenings — members mention crowding after 6pm.
                Consider a second HIIT batch.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[
                [<CountUp key="v" to={2340} />, 'profile views'],
                [<CountUp key="i" to={41} />, 'inquiries'],
                ['#2', 'in Indiranagar'],
              ].map(([v, l], i) => (
                <div key={i} className="rounded-[10px] bg-navy-raised py-2.5">
                  <p className="font-expanded text-[16px] font-black text-dark-1">{v}</p>
                  <p className="text-[9px] text-dark-3">{l}</p>
                </div>
              ))}
            </div>
          </m.div>
        </div>
      </Container>
    </Section>
  )
}
