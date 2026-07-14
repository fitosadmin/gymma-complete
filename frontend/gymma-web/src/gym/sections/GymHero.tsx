import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { m, useScroll, useTransform } from 'framer-motion'
import { ChevronDown, MapPin, Phone, ShieldCheck, Star } from 'lucide-react'
import { cn } from '../../lib/cn'
import { TierBadge } from '../../components/ui'
import { GymCover } from '../../home/GymCover'
import { CountUp } from '../../home/CountUp'
import type { GymDraft } from '../../builder/types'
import { FadeImage } from '../shared'
import type { GymMeta } from '../shared'

const lineReveal = (delay: number) => ({
  initial: { y: '110%' },
  animate: { y: '0%' },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
})

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
})

/** Act 1 — the gym's cinematic identity. Cover light, layered scrims, name as a monument. */
export function GymHero({ gym, meta, preview }: { gym: GymDraft; meta?: GymMeta; preview: boolean }) {
  const { basics, location, social } = gym
  const name = basics.name || 'Your Gym'
  const heroRef = useRef<HTMLElement>(null)

  // gentle cover parallax on the standalone page only (transform-only, scroll-linked)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const coverY = useTransform(scrollYProgress, [0, 1], ['0%', '16%'])

  const today = (new Date().getDay() + 6) % 7
  const hours = location.hours[today]
  const open = !hours.closed

  const stats: { value: number; label: string }[] = []
  const years = basics.foundedYear ? new Date().getFullYear() - Number(basics.foundedYear) : 0
  if (years > 0) stats.push({ value: years, label: 'years strong' })
  const pieces = gym.equipment.reduce((a, e) => a + e.qty, 0)
  if (pieces > 0) stats.push({ value: pieces, label: 'pieces of equipment' })
  const sessions = gym.classes.reduce((a, c) => a + c.days.length, 0)
  if (sessions > 0) stats.push({ value: sessions, label: 'classes every week' })
  if (gym.trainers.length > 0) stats.push({ value: gym.trainers.length, label: 'certified coaches' })
  if (meta) stats.push({ value: meta.reviews, label: 'verified reviews' })

  return (
    <header
      ref={heroRef}
      className={cn('relative flex flex-col overflow-hidden bg-navy-deep', preview ? 'min-h-[620px]' : 'min-h-[94svh]')}
    >
      {/* cover — uploaded photography or the art-directed procedural light */}
      <m.div className="absolute inset-0" style={preview ? undefined : { y: coverY }}>
        <m.div
          className="h-full w-full"
          initial={{ scale: 1.07 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {basics.cover ? (
            <FadeImage src={basics.cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <GymCover seed={name.length} initial={name.charAt(0).toUpperCase()} />
          )}
        </m.div>
      </m.div>
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/35 to-navy-deep/55" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-navy-deep to-transparent" />

      {/* custody chip — Gymma hands the stage to the gym, quietly */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5 md:px-10">
        <Link
          to="/"
          className="rounded-pill px-3 py-1.5 font-display text-[11px] font-extrabold uppercase tracking-wider text-dark-2 transition-colors duration-(--t-fast) hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
        >
          ← Gymma
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-navy-deep/70 px-3 py-1.5">
          <ShieldCheck size={13} className="text-copper" aria-hidden />
          <span className="font-display text-[11px] font-extrabold uppercase tracking-wider text-dark-2">
            Verified by Gymma
          </span>
        </span>
      </div>

      {/* the monument */}
      <div className="relative z-10 mx-auto mt-auto w-full max-w-[1296px] px-5 pb-10 pt-16 md:px-10 xl:px-12">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-8">
          <div className="min-w-0">
            {basics.logo && (
              <m.div {...fadeUp(0.1)}>
                <FadeImage
                  src={basics.logo}
                  alt={`${name} logo`}
                  className="mb-5 size-16 rounded-[14px] border border-white/20 bg-white object-cover md:size-[72px]"
                />
              </m.div>
            )}
            {/* word-mask reveal splits the visual text — aria-label keeps the real name for AT */}
            <h1 className="text-display-xl text-white" aria-label={name}>
              <span aria-hidden>
                {name.split(' ').slice(0, 3).map((word, i) => (
                  <span key={i} className="mr-[0.28em] inline-block overflow-hidden pb-1 align-bottom">
                    <m.span className="inline-block" {...lineReveal(0.15 + i * 0.09)}>
                      {word}
                    </m.span>
                  </span>
                ))}
              </span>
            </h1>
            {basics.tagline && (
              <m.p className="mt-3 max-w-[44ch] text-body-l text-dark-2" {...fadeUp(0.45)}>
                {basics.tagline}
              </m.p>
            )}
            <m.div className="mt-5 flex flex-wrap items-center gap-3 text-[14px] text-dark-2" {...fadeUp(0.55)}>
              {(location.landmark || location.city) && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} className="text-copper" aria-hidden />
                  {[location.landmark, location.city].filter(Boolean).join(', ')}
                </span>
              )}
              <span
                className={cn(
                  'inline-flex h-6 items-center rounded-pill px-3 font-display text-[11px] font-extrabold uppercase tracking-wider',
                  open ? 'bg-success/25 text-[#8fd0b4]' : 'bg-white/10 text-dark-3',
                )}
              >
                {open ? `Open today ${hours.open}–${hours.close}` : 'Closed today'}
              </span>
            </m.div>
          </div>

          {/* trust panel + actions — every gym gets the panel; only earned data differs */}
          <m.div className="flex flex-col items-start gap-5 md:items-end" {...fadeUp(0.5)}>
            {meta ? (
              <div className="flex items-center gap-4 rounded-md border border-copper/25 bg-navy-deep/75 px-5 py-4">
                <div>
                  <p className="flex items-center gap-1.5 font-expanded text-[30px] font-black leading-none text-white">
                    <Star size={20} className="text-copper" fill="currentColor" aria-hidden />
                    {meta.rating}
                  </p>
                  <p className="mt-1 text-[11px] text-dark-3">{meta.reviews} verified member reviews</p>
                </div>
                <div className="h-10 w-px bg-white/10" aria-hidden />
                <TierBadge tier={meta.tier} size="md" />
              </div>
            ) : (
              <div className="flex items-center gap-4 rounded-md border border-copper/25 bg-navy-deep/75 px-5 py-4">
                <div>
                  <p className="font-display text-[15px] font-extrabold text-white">Verified member reviews</p>
                  <p className="mt-1 text-[11px] text-dark-3">Unlock at 14 days + 5 logged workouts</p>
                </div>
                <div className="h-10 w-px bg-white/10" aria-hidden />
                <span className="inline-flex h-8 items-center rounded-[10px] border border-copper/25 bg-navy-raised px-3.5 font-expanded text-[12px] font-black uppercase tracking-[0.08em] text-copper-soft">
                  New on Gymma
                </span>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <a
                href={preview ? undefined : '#join'}
                onClick={preview ? undefined : (e) => { e.preventDefault(); document.getElementById('join')?.scrollIntoView({ behavior: 'smooth' }) }}
                className="inline-flex min-h-[52px] items-center justify-center rounded-sm bg-copper px-8 font-display text-[15px] font-extrabold tracking-[1px] text-white transition-all duration-(--t-fast) hover:-translate-y-0.5 hover:bg-copper-soft hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep active:scale-[0.98]"
              >
                Join now
              </a>
              {social.phone && (
                <a
                  href={preview ? undefined : `tel:${social.phone}`}
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-sm border-[1.5px] border-white/40 px-7 font-display text-[15px] font-extrabold tracking-[1px] text-white transition-colors duration-(--t-fast) hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper active:scale-[0.98]"
                >
                  <Phone size={15} aria-hidden /> Call
                </a>
              )}
            </div>
          </m.div>
        </div>

        {/* living statistics — the gym's substance, counted */}
        {stats.length > 0 && (
          <m.dl
            className="mt-10 flex flex-wrap gap-x-12 gap-y-5 border-t border-white/10 pt-7"
            {...fadeUp(0.7)}
          >
            {stats.slice(0, 4).map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <CountUp to={s.value} className="text-numeric text-[30px] text-gradient-copper" />
                  <p className="mt-0.5 text-[12px] uppercase tracking-wider text-dark-3">{s.label}</p>
                </dd>
              </div>
            ))}
          </m.dl>
        )}
      </div>

      {!preview && (
        <div aria-hidden className="relative z-10 pb-5 text-center">
          <ChevronDown size={18} className="mx-auto text-dark-3" />
        </div>
      )}
    </header>
  )
}
