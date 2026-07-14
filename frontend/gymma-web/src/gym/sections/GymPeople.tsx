import { useMemo, useState } from 'react'
import { m } from 'framer-motion'
import { AtSign, Calendar, Users } from 'lucide-react'
import { cn } from '../../lib/cn'
import { DAY_LABELS } from '../../builder/types'
import type { GymDraft } from '../../builder/types'
import { ActHeader, AsideStat, EmptyNote, FadeImage, MonogramTile, rise } from '../shared'

/** Act 5 — classes as a timetable you can feel, coaches as an editorial spread. */
export function GymPeople({ gym }: { gym: GymDraft }) {
  return (
    <>
      <Classes gym={gym} />
      <Trainers gym={gym} />
    </>
  )
}

function Classes({ gym }: { gym: GymDraft }) {
  const { classes } = gym
  const daysWithClasses = useMemo(
    () => DAY_LABELS.filter((d) => classes.some((c) => c.days.includes(d))),
    [classes],
  )
  const [day, setDay] = useState<string>('All')
  const visible = day === 'All' ? classes : classes.filter((c) => c.days.includes(day))
  const sessions = classes.reduce((a, c) => a + c.days.length, 0)

  return (
    <section id="classes" className="scroll-mt-14 bg-paper py-20 md:py-28">
      <div className="mx-auto max-w-[1296px] px-5 md:px-10 xl:px-12">
        <m.div {...rise(0)}>
          <ActHeader
            index="04"
            eyebrow="The timetable"
            title={<>Energy, on schedule.</>}
            aside={sessions > 0 ? <AsideStat value={sessions} label="sessions every week" /> : undefined}
          />
        </m.div>

        {classes.length > 0 ? (
          <>
            {daysWithClasses.length > 1 && (
              <m.div className="mt-10 flex flex-wrap gap-2" {...rise(0.1)}>
                {['All', ...daysWithClasses].map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={day === d}
                    onClick={() => setDay(d)}
                    className={cn(
                      'rounded-pill border px-4 py-2 text-[13px] font-semibold transition-colors duration-(--t-fast)',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper active:scale-[0.98]',
                      day === d ? 'border-navy bg-navy text-white' : 'border-line bg-white text-ink hover:border-muted/50',
                    )}
                  >
                    {d}
                  </button>
                ))}
              </m.div>
            )}
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {visible.map((c) => (
                <li key={c.id} className="animate-rise group grid items-center gap-x-8 gap-y-2 py-6 md:grid-cols-[120px_1fr_auto]">
                  <p className="text-numeric text-[26px] text-copper-dark md:text-[30px]">{c.time}</p>
                  <div>
                    <h3 className="text-h3 text-ink transition-colors duration-(--t-fast) group-hover:text-copper-dark">
                      {c.name}
                    </h3>
                    <p className="mt-0.5 text-[13.5px] text-muted">
                      {c.days.join(' · ')}
                      {c.trainer && <> — with <span className="font-semibold text-ink">{c.trainer}</span></>}
                    </p>
                  </div>
                  {c.capacity && (
                    <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted">
                      <Users size={13} className="text-copper" aria-hidden /> {c.capacity} spots
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="mt-10">
            <EmptyNote icon={Calendar} text="Class schedule will be updated soon — call the gym for this week's timetable." />
          </div>
        )}
      </div>
    </section>
  )
}

function Trainers({ gym }: { gym: GymDraft }) {
  const { trainers } = gym

  return (
    <section id="trainers" className="scroll-mt-14 bg-paper pb-20 md:pb-28">
      <div className="mx-auto max-w-[1296px] px-5 md:px-10 xl:px-12">
        <m.div {...rise(0)}>
          <ActHeader
            index="05"
            eyebrow="The coaches"
            title={<>Worth showing up for.</>}
            aside={
              trainers.length > 0 ? (
                <AsideStat
                  value={trainers.length}
                  label={trainers.length === 1 ? 'certified coach' : 'certified coaches'}
                />
              ) : undefined
            }
          />
        </m.div>

        {trainers.length > 0 ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trainers.map((t, i) => (
              <m.article
                key={t.id}
                className={cn(
                  'group overflow-hidden rounded-md border border-line bg-card shadow-sm',
                  'transition-all duration-(--t-base) ease-out-soft hover:-translate-y-1.5 hover:shadow-md',
                  i % 3 === 1 && 'lg:mt-10',
                )}
                {...rise(0.06 + i * 0.08)}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {t.photo ? (
                    <FadeImage
                      src={t.photo}
                      alt={t.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-[700ms] ease-out-soft group-hover:scale-[1.05]"
                    />
                  ) : (
                    <MonogramTile name={t.name || 'C'} className="h-full w-full" />
                  )}
                  {t.experienceYears != null && t.experienceYears > 0 && (
                    <span className="absolute left-3 top-3 rounded-pill bg-navy-deep/75 px-3 py-1 font-display text-[11px] font-extrabold uppercase tracking-wider text-dark-2">
                      {t.experienceYears} yrs
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-[20px] font-extrabold text-ink">{t.name}</h3>
                      <p className="mt-0.5 text-[13px] font-semibold uppercase tracking-wider text-copper-dark">
                        {t.specialization}
                      </p>
                    </div>
                    {t.instagram && (
                      <a
                        href={`https://instagram.com/${t.instagram.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${t.name} on Instagram`}
                        className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors duration-(--t-fast) hover:bg-paper hover:text-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
                      >
                        <AtSign size={16} aria-hidden />
                      </a>
                    )}
                  </div>
                  {t.bio && <p className="mt-3 text-[14px] leading-relaxed text-muted">{t.bio}</p>}
                  {t.certifications.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {t.certifications.map((c) => (
                        <span key={c} className="rounded-pill border border-copper/40 px-2.5 py-0.5 text-[11.5px] font-semibold text-copper-dark">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </m.article>
            ))}
          </div>
        ) : (
          <div className="mt-10">
            <EmptyNote icon={Users} text="Trainer profiles coming soon — meet the team at the gym." />
          </div>
        )}
      </div>
    </section>
  )
}
