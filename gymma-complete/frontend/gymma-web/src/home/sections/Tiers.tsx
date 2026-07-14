import { m } from 'framer-motion'
import { Container, Eyebrow, Section, TierBadge } from '../../components/ui'
import type { Tier } from '../../components/ui'
import { cn } from '../../lib/cn'

const TIERS: { tier: Tier; message: string; share: string }[] = [
  { tier: 'A', message: 'Entry level — meets basic fitness standards.', share: '40% of gyms' },
  { tier: 'AA', message: 'Quality certified — above average, worth recommending.', share: '35% of gyms' },
  { tier: 'AAA', message: 'Premium — exceptional across all six dimensions.', share: '20% of gyms' },
  { tier: 'Elite', message: 'World class — among the best facilities anywhere.', share: 'Top 5%' },
]

/** Act 4 (dark, gravity) — the Michelin moment. Space, restraint, ascent. */
export function Tiers() {
  return (
    <Section tone="dark" glow="tl" size="gravity">
      <Container>
        <div className="text-center">
          <Eyebrow>03 · The standard</Eyebrow>
          <h2 className="mx-auto mt-3 max-w-[18ch] text-display text-dark-1">
            A rating you can't buy. <span className="text-gradient-copper">Only earn.</span>
          </h2>
        </div>

        {/* desktop: 4 ascending plaques · mobile: snap carousel with peek */}
        <ul className="mt-16 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 max-lg:-mx-5 max-lg:px-5 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:pb-0">
          {TIERS.map((t, i) => (
            <m.li
              key={t.tier}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.45, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'shrink-0 snap-center rounded-md border border-copper/15 bg-navy-raised p-7 text-center',
                'w-[78vw] sm:w-[320px] lg:w-auto',
                t.tier === 'Elite' && 'lg:scale-[1.06] lg:border-copper/30',
              )}
            >
              <div className="flex justify-center">
                <TierBadge tier={t.tier} size="md" />
              </div>
              <p className="mt-5 min-h-[3.2em] text-[14.5px] leading-relaxed text-dark-2">{t.message}</p>
              <p className="mt-3 font-display text-[11px] font-extrabold uppercase tracking-widest text-dark-3">
                {t.share}
              </p>
            </m.li>
          ))}
        </ul>

        <p className="mx-auto mt-12 max-w-[62ch] text-center text-[14.5px] leading-relaxed text-dark-3">
          Scores are Bayesian-weighted and a tier must hold for 14 days before it changes —
          no gaming the system with a few good reviews.
        </p>
      </Container>
    </Section>
  )
}
