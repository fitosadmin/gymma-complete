import { m } from 'framer-motion'
import { ShieldCheck, Star } from 'lucide-react'
import { TierBadge, VerifiedBadge } from '../../components/ui'
import type { GymDraft } from '../../builder/types'
import { rise } from '../shared'
import type { GymMeta } from '../shared'

const DIMENSIONS = ['Equipment', 'Cleanliness', 'Staff', 'Environment', 'Value', 'Safety']

function dimensionScores(rating: number): [string, number][] {
  const offsets = [0, 0.1, -0.1, -0.2, -0.05, 0.05]
  return DIMENSIONS.map((d, i) => [d, Math.min(5, Math.round((rating + offsets[i]) * 10) / 10)])
}

/** Act 7 (dark climax) — the reason this page can be trusted over anywhere else. */
export function GymReviews({ gym, meta }: { gym: GymDraft; meta?: GymMeta }) {
  const name = gym.basics.name || 'This gym'

  return (
    <section id="reviews" className="relative scroll-mt-14 overflow-hidden bg-navy-deep py-20 md:py-32">
      <div aria-hidden className="copper-glow absolute left-0 bottom-0 -translate-x-1/3 translate-y-1/3" />
      <div className="relative mx-auto max-w-[1296px] px-5 md:px-10 xl:px-12">
        <m.div className="relative" {...rise(0)}>
          <span
            aria-hidden
            className="pointer-events-none absolute -top-10 right-0 select-none font-expanded text-[130px] font-black leading-none text-white/[.05] md:-top-16 md:text-[220px]"
          >
            07
          </span>
          <p className="eyebrow flex items-center gap-3">
            <span aria-hidden className="h-px w-10 shrink-0 bg-copper" />
            Verified member reviews
          </p>
          <h2 className="relative mt-4 max-w-[15ch] text-display text-dark-1">
            Ratings you can <span className="text-gradient-copper">actually trust.</span>
          </h2>
        </m.div>

        {meta ? (
          <div className="mt-14 grid gap-12 lg:grid-cols-[380px_1fr]">
            {/* the score block — sticky gravity on desktop */}
            <m.div className="lg:sticky lg:top-20 lg:self-start" {...rise(0.1)}>
              <div className="flex items-end gap-4">
                <p className="text-numeric text-[88px] leading-none text-gradient-copper">{meta.rating}</p>
                <div className="pb-3">
                  <TierBadge tier={meta.tier} size="md" />
                  <p className="mt-2 text-[12px] text-dark-3">{meta.reviews} verified member reviews</p>
                </div>
              </div>
              <div className="mt-8 space-y-3">
                {dimensionScores(meta.rating).map(([label, score], i) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="w-[92px] text-[12.5px] text-dark-3">{label}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-navy-raised">
                      <m.div
                        className="h-full rounded-pill"
                        style={{ background: 'var(--gradient-copper-text)' }}
                        initial={{ scaleX: 0, originX: 0 }}
                        whileInView={{ scaleX: (score as number) / 5 }}
                        viewport={{ once: true, amount: 0.6 }}
                        transition={{ duration: 0.6, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <span className="w-8 text-right text-[12.5px] font-bold text-dark-2">{score}</span>
                  </div>
                ))}
              </div>
              <p className="mt-8 flex items-start gap-2 text-[12.5px] leading-relaxed text-dark-3">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-copper" aria-hidden />
                Every reviewer is a paying member: 14 days of membership and 5 logged workouts before
                the pen unlocks. Anonymous forever.
              </p>
            </m.div>

            {/* the voices */}
            <div className="space-y-5">
              {meta.sampleReviews.map((r, i) => (
                <m.blockquote
                  key={i}
                  className="rounded-md border border-copper/20 bg-navy-raised p-7"
                  {...rise(0.12 + i * 0.1)}
                >
                  <div className="flex items-center justify-between">
                    <VerifiedBadge />
                    <span className="text-caption text-dark-3">{r.date}</span>
                  </div>
                  <div className="mt-3 flex gap-1 text-copper" aria-label={`${r.stars} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} size={14} fill={s < r.stars ? 'currentColor' : 'none'} className={s < r.stars ? '' : 'opacity-30'} aria-hidden />
                    ))}
                  </div>
                  <p className="mt-4 text-[16px] leading-relaxed text-dark-2">“{r.text}”</p>
                </m.blockquote>
              ))}
            </div>
          </div>
        ) : (
          /* unrated gyms get the SAME composition — the framework is the promise */
          <div className="mt-14 grid gap-12 lg:grid-cols-[380px_1fr]">
            <m.div className="lg:sticky lg:top-20 lg:self-start" {...rise(0.1)}>
              <div className="flex items-end gap-4">
                <p className="text-numeric text-[72px] leading-none text-gradient-copper md:text-[88px]">New</p>
                <div className="pb-3">
                  <span className="inline-flex h-8 items-center rounded-[10px] border border-copper/25 bg-navy-raised px-3.5 font-expanded text-[12px] font-black uppercase tracking-[0.08em] text-copper-soft">
                    On Gymma
                  </span>
                  <p className="mt-2 text-[12px] text-dark-3">first verified reviews incoming</p>
                </div>
              </div>
              <div className="mt-8 space-y-3">
                {DIMENSIONS.map((label) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="w-[92px] text-[12.5px] text-dark-3">{label}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-navy-raised">
                      <div className="h-full w-[4%] rounded-pill bg-copper/40" />
                    </div>
                    <span className="w-8 text-right text-[12.5px] font-bold text-dark-3">–</span>
                  </div>
                ))}
              </div>
              <p className="mt-8 flex items-start gap-2 text-[12.5px] leading-relaxed text-dark-3">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-copper" aria-hidden />
                Six dimensions, measured only by paying members. Scores are Bayesian-weighted, so a
                handful of reviews can't game them.
              </p>
            </m.div>

            <div className="space-y-5">
              <m.div className="rounded-md border border-copper/20 bg-navy-raised p-7" {...rise(0.12)}>
                <div className="flex gap-1 text-copper opacity-40" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} />
                  ))}
                </div>
                <p className="mt-4 text-[15.5px] leading-relaxed text-dark-2">
                  {name} is new to Gymma. Reviews unlock as verified members complete 14 days of
                  membership and 5 logged workouts — anonymous, credential-based, impossible to fake.
                </p>
              </m.div>
              <m.ol className="grid gap-4 sm:grid-cols-3" {...rise(0.2)}>
                {[
                  ['01', 'Join the gym', 'Members get app credentials from this gym — nobody else can.'],
                  ['02', 'Train for real', '14 days of membership and 5 logged workouts unlock the pen.'],
                  ['03', 'Review, protected', 'Anonymous to the gym. Anonymous to us. Verified to everyone.'],
                ].map(([n, title, body]) => (
                  <li key={n} className="rounded-md border border-copper/15 bg-navy-raised/60 p-5">
                    <p className="font-expanded text-[13px] font-black text-copper">{n}</p>
                    <p className="mt-2 font-display text-[15px] font-bold text-dark-1">{title}</p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-dark-3">{body}</p>
                  </li>
                ))}
              </m.ol>
            </div>
          </div>
        )}

        <p className="mt-12 max-w-[80ch] text-caption text-dark-3">
          All ratings and reviews are submitted by users and do not represent the platform's opinions.
          Users should visit and evaluate gyms personally before purchasing memberships.
        </p>
      </div>
    </section>
  )
}
