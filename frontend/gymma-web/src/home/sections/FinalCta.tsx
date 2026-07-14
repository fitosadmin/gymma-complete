import { Link } from 'react-router-dom'
import { m } from 'framer-motion'
import { Phone } from 'lucide-react'
import { Container, Section } from '../../components/ui'

/** Act 10 — the poster's proven closer: the gradient box. */
export function FinalCta() {
  return (
    <Section tone="paper" size="utility">
      <Container>
        <m.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-lg bg-gradient-brand px-6 py-14 text-center md:px-14 md:py-20"
        >
          <div aria-hidden className="absolute -bottom-24 -left-24 size-[300px] rounded-full bg-white/6" />
          <p className="relative font-expanded text-[18px] font-black tracking-wide text-white/85">GYMMA</p>
          <h2 className="relative mx-auto mt-4 max-w-[18ch] text-display text-white">
            Get on board within 48 hours.
          </h2>
          <p className="relative mt-3 text-body-l text-white/85">And get a one-month free trial.</p>
          <div className="relative mt-9">
            <Link
              to="/partner/start"
              className="inline-flex min-h-[56px] items-center justify-center rounded-sm bg-white px-10 font-display text-[15px] font-extrabold uppercase tracking-[1.5px] text-navy transition-all duration-(--t-fast) hover:-translate-y-0.5 hover:shadow-overlay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy active:scale-[0.98] max-md:w-full"
            >
              Start your free trial
            </Link>
          </div>
          <p className="relative mt-5 text-[13px] text-white/70">
            No setup fees · No credit card required · Full support included
          </p>
          <a
            href="tel:+919591276584"
            className="relative mt-6 inline-flex items-center gap-2 rounded-[4px] font-display text-[15px] font-extrabold text-white transition-opacity duration-(--t-fast) hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Phone size={15} aria-hidden /> Contact us for an app demo — 95912 76584
          </a>
        </m.div>
      </Container>
    </Section>
  )
}
