import { m } from 'framer-motion'
import type { GymDraft } from '../../builder/types'
import { rise } from '../shared'

/** Act 2 — the story, told editorially: an oversized statement, not a paragraph in a box. */
export function GymAbout({ gym }: { gym: GymDraft }) {
  const { basics } = gym
  if (!basics.description && !basics.ownerName) return null

  return (
    <section id="about" className="scroll-mt-14 bg-paper py-20 md:py-28">
      <div className="relative mx-auto max-w-[1296px] px-5 md:px-10 xl:px-12">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-8 right-5 select-none font-expanded text-[130px] font-black leading-none text-navy/[.05] md:-top-12 md:right-10 md:text-[220px]"
        >
          01
        </span>
        <div className="relative grid gap-12 lg:grid-cols-12">
          <m.div className="lg:col-span-3" {...rise(0)}>
            <p className="eyebrow flex items-center gap-3">
              <span aria-hidden className="h-px w-10 shrink-0 bg-copper" />
              The story
            </p>
            {basics.foundedYear && (
              <p className="mt-6 text-numeric text-[80px] leading-none text-gradient-copper md:text-[96px]">
                '{basics.foundedYear.slice(-2)}
              </p>
            )}
            {basics.foundedYear && (
              <p className="mt-1 text-[13px] uppercase tracking-wider text-muted">est. {basics.foundedYear}</p>
            )}
          </m.div>
          <div className="lg:col-span-9">
            {basics.description && (
              <m.p
                className="max-w-[30ch] font-display text-[26px] font-bold leading-[1.4] text-navy md:text-[32px]"
                {...rise(0.08)}
              >
                {basics.description.split('.')[0]}.
              </m.p>
            )}
            {basics.description && basics.description.split('.').slice(1).join('.').trim() && (
              <m.p className="mt-6 max-w-[64ch] text-body-l text-muted" {...rise(0.16)}>
                {basics.description.split('.').slice(1).join('.').trim()}
              </m.p>
            )}
            {(basics.ownerName || basics.category) && (
              <m.div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3" {...rise(0.22)}>
                {basics.ownerName && (
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-gradient-brand font-display text-[14px] font-black text-white">
                      {basics.ownerName.charAt(0)}
                    </span>
                    <div>
                      <p className="text-[14px] font-bold text-ink">{basics.ownerName}</p>
                      <p className="text-caption text-muted">Founder</p>
                    </div>
                  </div>
                )}
                {basics.category && (
                  <span className="rounded-pill border border-line px-3.5 py-1.5 text-[12.5px] font-semibold text-muted">
                    {basics.category}
                  </span>
                )}
              </m.div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
