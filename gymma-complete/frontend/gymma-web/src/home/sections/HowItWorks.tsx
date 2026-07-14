import { m } from 'framer-motion'
import { Container, Eyebrow, Section } from '../../components/ui'

const STEPS = [
  { n: '1', title: 'Subscribe', body: 'Sign up and create your gym profile.' },
  { n: '2', title: 'Onboard', body: 'Add coaches, upload certifications and achievements.' },
  { n: '3', title: 'Connect', body: 'Invite members — they download the free Gymma app linked to your gym.' },
]

/** Act 8 — kill perceived complexity. Three steps, 48 hours. */
export function HowItWorks() {
  return (
    <Section tone="paper" size="utility">
      <Container>
        <div className="text-center">
          <Eyebrow>07 · Getting started</Eyebrow>
          <h2 className="mt-3 text-h2 text-navy">From signup to live in 48 hours.</h2>
        </div>
        <div className="relative mt-14">
          <div aria-hidden className="absolute left-[16%] right-[16%] top-7 hidden h-[2px] bg-gradient-brand opacity-25 md:block" />
          <ol className="grid gap-10 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <m.li
                key={s.n}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="flex gap-5 text-left md:block md:text-center"
              >
                <span className="relative z-10 grid size-14 shrink-0 place-items-center rounded-full bg-gradient-brand font-expanded text-[20px] font-black text-white md:mx-auto">
                  {s.n}
                </span>
                <div className="md:mt-5">
                  <h3 className="font-display text-[13px] font-extrabold uppercase tracking-[2.5px] text-navy">
                    {s.title}
                  </h3>
                  <p className="mx-auto mt-2 max-w-[30ch] text-[14.5px] leading-relaxed text-muted">{s.body}</p>
                </div>
              </m.li>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  )
}
