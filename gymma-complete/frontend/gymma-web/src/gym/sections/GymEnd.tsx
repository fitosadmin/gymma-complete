import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { m } from 'framer-motion'
import { AtSign, Clock, Globe, MapPin, Navigation, Phone, Play, ThumbsUp } from 'lucide-react'
import { cn } from '../../lib/cn'
import { DAY_LABELS } from '../../builder/types'
import type { GymDraft } from '../../builder/types'
import { ActHeader, AsideStat, rise } from '../shared'

function directionsUrl(gym: GymDraft): string {
  if (gym.location.mapsUrl) return gym.location.mapsUrl
  const q = encodeURIComponent(
    [gym.basics.name, gym.location.address, gym.location.city].filter(Boolean).join(', '),
  )
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}

/** Act 8 — logistics without friction: where, when, and the one big yes. */
export function GymLocation({ gym, preview }: { gym: GymDraft; preview: boolean }) {
  const { location } = gym
  const today = (new Date().getDay() + 6) % 7
  const todayHours = location.hours[today]
  if (!location.address && !location.city) return null

  return (
    <section id="location" className="scroll-mt-14 bg-paper py-20 md:py-28">
      <div className="mx-auto max-w-[1296px] px-5 md:px-10 xl:px-12">
        <m.div {...rise(0)}>
          <ActHeader
            index="08"
            eyebrow="Find us"
            title={<>Closer than you think.</>}
            aside={
              !todayHours.closed ? (
                <AsideStat value={todayHours.close} label="open today till" />
              ) : undefined
            }
          />
        </m.div>

        <div className="mt-12 grid gap-6 lg:grid-cols-5">
          {/* the address as a destination, not a form field */}
          <m.div
            className="relative overflow-hidden rounded-md bg-navy-deep p-8 lg:col-span-3"
            {...rise(0.08)}
          >
            <div
              aria-hidden
              className="absolute right-0 top-0 size-[360px] translate-x-1/3 -translate-y-1/3 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(196,106,74,.22), transparent 70%)' }}
            />
            <div className="relative">
              <span className="grid size-12 place-items-center rounded-full bg-copper/15 text-copper">
                <MapPin size={22} aria-hidden />
              </span>
              <p className="mt-6 max-w-[26ch] font-display text-[24px] font-extrabold leading-snug text-dark-1">
                {location.address}
              </p>
              {location.landmark && <p className="mt-2 text-[15px] text-copper-soft">{location.landmark}</p>}
              <p className="mt-1 text-[14px] text-dark-3">
                {[location.city, location.state, location.pincode].filter(Boolean).join(', ')}
              </p>
              <a
                href={preview ? undefined : directionsUrl(gym)}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-sm border-[1.5px] border-white/40 px-6 py-3 font-display text-[14px] font-extrabold tracking-[1px] text-white transition-colors duration-(--t-fast) hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper active:scale-[0.98]"
              >
                <Navigation size={15} aria-hidden /> Get directions
              </a>
            </div>
          </m.div>

          {/* hours — today lit */}
          <m.div className="rounded-md border border-line bg-card p-7 lg:col-span-2" {...rise(0.16)}>
            <p className="mb-4 flex items-center gap-2 font-display text-[13px] font-bold uppercase tracking-wider text-muted">
              <Clock size={15} aria-hidden /> Working hours
            </p>
            <table className="w-full text-[14.5px]">
              <tbody>
                {location.hours.map((h, i) => (
                  <tr key={i} className={cn(i === today ? 'font-bold text-copper-dark' : 'text-ink')}>
                    <td className="py-1.5">
                      {DAY_LABELS[i]}
                      {i === today && <span className="ml-2 rounded-pill bg-copper/10 px-2 py-0.5 text-[10px] uppercase tracking-wider">today</span>}
                    </td>
                    <td className="py-1.5 text-right">{h.closed ? <span className="text-muted">Closed</span> : `${h.open} – ${h.close}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {location.parking && <p className="mt-4 border-t border-line pt-4 text-[13px] text-muted">✓ Parking available</p>}
          </m.div>
        </div>
      </div>
    </section>
  )
}

export function GymCta({ gym, preview }: { gym: GymDraft; preview: boolean }) {
  const name = gym.basics.name || 'this gym'
  const { social } = gym
  return (
    <section id="join" className="scroll-mt-14 bg-paper pb-20 md:pb-28">
      <div className="mx-auto max-w-[1296px] px-5 md:px-10 xl:px-12">
        <m.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-lg bg-gradient-brand px-6 py-14 text-center md:px-14 md:py-20"
        >
          <div aria-hidden className="absolute -bottom-24 -left-24 size-[300px] rounded-full bg-white/6" />
          <h2 className="relative mx-auto max-w-[16ch] text-display text-white">
            Ready to train at {name}?
          </h2>
          <p className="relative mx-auto mt-3 max-w-[44ch] text-body-l text-white/85">
            Call, message, or just walk in — your first visit is the best way to know.
          </p>
          <div className="relative mt-9 flex flex-wrap justify-center gap-3">
            {social.phone && (
              <a
                href={preview ? undefined : `tel:${social.phone}`}
                className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-sm bg-white px-8 font-display text-[15px] font-extrabold tracking-[1px] text-navy transition-all duration-(--t-fast) hover:-translate-y-0.5 hover:shadow-overlay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy active:scale-[0.98] max-md:w-full"
              >
                <Phone size={15} aria-hidden /> {social.phone}
              </a>
            )}
            {social.whatsapp && (
              <a
                href={preview ? undefined : `https://wa.me/${social.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[54px] items-center justify-center rounded-sm border-[1.5px] border-white/50 px-8 font-display text-[15px] font-extrabold tracking-[1px] text-white transition-colors duration-(--t-fast) hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-[0.98] max-md:w-full"
              >
                WhatsApp
              </a>
            )}
          </div>
        </m.div>
      </div>
    </section>
  )
}

const SOCIALS = [
  { key: 'instagram', icon: AtSign, prefix: 'https://instagram.com/' },
  { key: 'facebook', icon: ThumbsUp, prefix: '' },
  { key: 'youtube', icon: Play, prefix: '' },
  { key: 'website', icon: Globe, prefix: '' },
] as const

export function GymFooter({ gym, preview }: { gym: GymDraft; preview: boolean }) {
  const { social } = gym
  const links = SOCIALS.filter((s) => social[s.key].trim())
  return (
    <footer className="border-t border-line bg-paper py-8">
      <div className="mx-auto flex max-w-[1296px] flex-wrap items-center justify-between gap-4 px-5 md:px-10 xl:px-12">
        <p className="text-caption text-muted">
          ◆ Powered by{' '}
          <Link to="/" className="font-display font-extrabold text-copper transition-colors duration-(--t-fast) hover:text-copper-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper rounded-[3px]">
            GYMMA
          </Link>{' '}
          — verified reviews you can trust
        </p>
        {links.length > 0 && (
          <div className="flex gap-2">
            {links.map((s) => {
              const raw = social[s.key].trim()
              const href = raw.startsWith('http') ? raw : `${s.prefix || 'https://'}${raw.replace(/^@/, '')}`
              return (
                <a
                  key={s.key}
                  href={preview ? undefined : href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.key}
                  className="grid size-10 place-items-center rounded-full text-muted transition-colors duration-(--t-fast) hover:bg-card hover:text-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
                >
                  <s.icon size={17} aria-hidden />
                </a>
              )
            })}
          </div>
        )}
      </div>
    </footer>
  )
}

/** Thumb-reach conversion floor — mobile, standalone only (GP13). */
export function StickyActionBar({ gym }: { gym: GymDraft }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // plain state set — identical booleans skip re-render, so no rAF throttle
    // needed (and rAF stalls in occluded tabs)
    const onScroll = () => setVisible(window.scrollY > 520)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-line bg-paper/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 lg:hidden',
        'transition-transform duration-(--t-base) ease-out-soft',
        visible ? 'translate-y-0' : 'translate-y-full',
      )}
    >
      <button
        type="button"
        onClick={() => document.getElementById('join')?.scrollIntoView({ behavior: 'smooth' })}
        className="flex min-h-[48px] flex-[3] items-center justify-center rounded-sm bg-copper font-display text-[14px] font-extrabold tracking-[1px] text-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2"
      >
        Join now
      </button>
      {gym.social.phone && (
        <a
          href={`tel:${gym.social.phone}`}
          aria-label="Call the gym"
          className="grid min-h-[48px] flex-1 place-items-center rounded-sm border-[1.5px] border-navy text-navy active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
        >
          <Phone size={18} aria-hidden />
        </a>
      )}
      <a
        href={directionsUrl(gym)}
        target="_blank"
        rel="noreferrer"
        aria-label="Get directions"
        className="grid min-h-[48px] flex-1 place-items-center rounded-sm border-[1.5px] border-navy text-navy active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
      >
        <Navigation size={18} aria-hidden />
      </a>
    </div>
  )
}
