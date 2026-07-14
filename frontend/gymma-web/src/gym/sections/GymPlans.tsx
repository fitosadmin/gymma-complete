import { m } from 'framer-motion'
import { Check, Wallet } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { GymDraft } from '../../builder/types'
import { ActHeader, AsideStat, EmptyNote, rise } from '../shared'

/** Act 6 — the membership ladder. Honest numbers, the recommended rung lit in copper. */
export function GymPlans({ gym }: { gym: GymDraft }) {
  const { plans, social } = gym
  const name = gym.basics.name || 'the gym'
  const monthlyRates = plans
    .filter((p) => p.price && p.durationMonths > 0)
    .map((p) => Math.round(p.price! / p.durationMonths))
  const fromMonthly = monthlyRates.length ? Math.min(...monthlyRates) : null

  return (
    <section id="plans" className="scroll-mt-14 bg-paper py-20 md:py-32">
      <div className="mx-auto max-w-[1296px] px-5 md:px-10 xl:px-12">
        <m.div {...rise(0)}>
          <ActHeader
            index="06"
            eyebrow="Membership"
            title={<>Zero fine print.</>}
            kicker="These are the gym's own prices, published in full — hidden costs are how trust dies."
            aside={
              fromMonthly ? (
                <AsideStat value={<>₹{fromMonthly.toLocaleString('en-IN')}</>} label="per month, from" />
              ) : undefined
            }
          />
        </m.div>

        {plans.length > 0 ? (
          <div className="mt-14 grid items-end gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((p, i) => {
              const perMonth = p.price && p.durationMonths > 1 ? Math.round(p.price / p.durationMonths) : null
              const card = (
                <div
                  className={cn(
                    'flex h-full flex-col rounded-md bg-card p-7',
                    p.popular ? 'shadow-lg' : 'border border-line shadow-sm transition-all duration-(--t-base) ease-out-soft hover:-translate-y-1 hover:shadow-md',
                  )}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-[16px] font-extrabold text-ink">{p.name}</h3>
                    {p.popular && (
                      <span className="rounded-pill bg-gradient-brand px-3 py-1 font-display text-[10px] font-extrabold uppercase tracking-widest text-white">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className={cn('mt-5 text-numeric text-[38px] leading-none', p.popular ? 'text-gradient-copper' : 'text-navy')}>
                    ₹{p.price?.toLocaleString('en-IN') ?? '—'}
                  </p>
                  <p className="mt-2 text-[12.5px] text-muted">
                    {p.durationMonths} {p.durationMonths === 1 ? 'month' : 'months'}
                    {perMonth && <> · ≈ ₹{perMonth.toLocaleString('en-IN')}/mo</>}
                    {p.joiningFee ? <> · ₹{p.joiningFee.toLocaleString('en-IN')} joining</> : null}
                  </p>
                  {p.offer && (
                    <p className="mt-3 inline-flex w-fit rounded-pill bg-copper/10 px-3 py-1 text-[12px] font-bold text-copper-dark">
                      {p.offer}
                    </p>
                  )}
                  {p.benefits.length > 0 && (
                    <ul className="mt-5 space-y-2 border-t border-line pt-5">
                      {p.benefits.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-[13.5px] text-muted">
                          <Check size={14} className="mt-0.5 shrink-0 text-copper" aria-hidden /> {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
              return (
                <m.div key={p.id} {...rise(0.08 + i * 0.08, 26)}>
                  {p.popular ? (
                    <div className="rounded-[22px] bg-gradient-brand p-[2px] transition-transform duration-(--t-base) ease-out-soft hover:-translate-y-1">
                      {card}
                    </div>
                  ) : (
                    card
                  )}
                </m.div>
              )
            })}
          </div>
        ) : (
          <div className="mt-12">
            <EmptyNote icon={Wallet} text={`Contact ${name} for the latest membership plans and offers${social.phone ? ` — ${social.phone}` : ''}.`} />
          </div>
        )}
      </div>
    </section>
  )
}
