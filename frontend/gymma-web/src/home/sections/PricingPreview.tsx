import { Link } from 'react-router-dom'
import { m } from 'framer-motion'
import { Container, Eyebrow, Section, StatusBadge } from '../../components/ui'
import { cn } from '../../lib/cn'

/* Poster pricing — locked. ₹4,449 / ₹6,899 / ₹9,799 / ₹10,799. */
const TIERS = [
  { name: 'Starter', price: '4,449', cap: 'Up to 50 members', popular: false },
  { name: 'Growth', price: '6,899', cap: 'Up to 100 members', popular: true },
  { name: 'Pro', price: '9,799', cap: 'Up to 200 members', popular: false },
  { name: 'Scale', price: '10,799', cap: 'Up to 300 members', popular: false },
]

/** Act 9 — respect through transparency. Showing the price IS brand behavior. */
export function PricingPreview() {
  return (
    <Section tone="paper" id="pricing" className="scroll-mt-16">
      <Container>
        <div className="text-center">
          <Eyebrow>08 · Pricing</Eyebrow>
          <h2 className="mt-3 text-h2 text-navy">Simple, per-member pricing.</h2>
          <p className="mx-auto mt-3 max-w-[54ch] text-body-l text-muted">
            Every plan is full-featured — app, reviews, dashboard. You pay for member capacity, nothing else.
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-2 items-end gap-4 lg:grid-cols-4 lg:gap-5">
          {TIERS.map((t, i) => (
            <m.li
              key={t.name}
              initial={{ opacity: 0, y: t.popular ? 24 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.35, delay: i * 0.07 + (t.popular ? 0.06 : 0), ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'rounded-md bg-card p-5 md:p-6',
                t.popular ? 'border-2 border-copper shadow-lg' : 'border border-line shadow-sm',
              )}
            >
              {t.popular && (
                <div className="mb-3">
                  <StatusBadge status="popular" />
                </div>
              )}
              <h3 className="font-display text-[15px] font-extrabold text-ink">{t.name}</h3>
              <p className={cn('mt-2 text-numeric text-[26px] md:text-[30px]', t.popular ? 'text-gradient-copper' : 'text-navy')}>
                ₹{t.price}
                <span className="font-body text-[12px] font-normal text-muted">/mo</span>
              </p>
              <p className="mt-1 text-[12.5px] text-muted">{t.cap}</p>
            </m.li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <p className="text-[13.5px] text-muted">
            +₹1,000 per extra 100 members · 1-month free trial · no setup fees · no credit card
          </p>
          <Link
            to="/partner/start"
            className="inline-flex min-h-[52px] items-center justify-center rounded-sm bg-copper px-8 font-display text-[15px] font-extrabold tracking-[1px] text-white transition-all duration-(--t-fast) hover:-translate-y-0.5 hover:bg-copper-soft hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            Start your free trial
          </Link>
        </div>
      </Container>
    </Section>
  )
}
