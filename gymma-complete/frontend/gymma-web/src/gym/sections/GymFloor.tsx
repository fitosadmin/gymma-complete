import { useMemo, useState } from 'react'
import { m } from 'framer-motion'
import {
  Accessibility, Baby, Car, Cloudy, Coffee, Dumbbell, Flame, GlassWater, Heart,
  HeartPulse, Lock, PersonStanding, ShowerHead, Snowflake, Users, Wifi, Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'
import { FACILITIES } from '../../builder/catalog'
import type { GymDraft } from '../../builder/types'
import { ActHeader, AsideStat, EmptyNote, rise } from '../shared'
import { CountUp } from '../../home/CountUp'

const FACILITY_ICONS: Record<string, LucideIcon> = {
  ac: Snowflake, parking: Car, lockers: Lock, shower: ShowerHead, steam: Cloudy,
  sauna: Flame, wifi: Wifi, 'ro-water': GlassWater, cafe: Coffee, pt: PersonStanding,
  'womens-section': Heart, 'kids-area': Baby, wheelchair: Accessibility,
  'group-classes': Users, 'cardio-zone': HeartPulse, 'crossfit-zone': Zap,
}

/** Act 4 (dark) — the floor itself: what you'll train on, and everything handled around it. */
export function GymFloor({ gym }: { gym: GymDraft }) {
  const { equipment, facilities } = gym
  const [cat, setCat] = useState('All')

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(equipment.map((e) => e.category)))],
    [equipment],
  )
  const visible = cat === 'All' ? equipment : equipment.filter((e) => e.category === cat)
  const totalPieces = equipment.reduce((a, e) => a + e.qty, 0)
  const amenities = FACILITIES.filter((f) => facilities.includes(f.id))

  if (equipment.length === 0 && amenities.length === 0) return null

  return (
    <section id="floor" className="relative scroll-mt-14 overflow-hidden bg-navy-deep py-20 md:py-28">
      <div aria-hidden className="copper-glow absolute right-0 top-0 translate-x-1/3 -translate-y-1/3" />
      <div className="relative mx-auto max-w-[1296px] px-5 md:px-10 xl:px-12">
        <m.div {...rise(0)}>
          <ActHeader
            dark
            index="03"
            eyebrow="The floor"
            title={<>Built for the work.</>}
            aside={
              totalPieces > 0 ? (
                <AsideStat dark value={<CountUp to={totalPieces} />} label="pieces on the floor" />
              ) : undefined
            }
          />
        </m.div>

        {/* equipment — interactive, filterable, alive */}
        {equipment.length > 0 ? (
          <div className="mt-12">
            {categories.length > 2 && (
              <m.div className="flex flex-wrap gap-2" {...rise(0.12)}>
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={cat === c}
                    onClick={() => setCat(c)}
                    className={cn(
                      'rounded-pill border px-4 py-2 text-[13px] font-semibold transition-colors duration-(--t-fast)',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper active:scale-[0.98]',
                      cat === c
                        ? 'border-copper bg-copper text-white'
                        : 'border-white/15 text-dark-2 hover:border-copper/50 hover:text-white',
                    )}
                  >
                    {c}
                  </button>
                ))}
              </m.div>
            )}
            <ul className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((e, i) => (
                <m.li
                  key={e.id}
                  className="animate-rise group flex items-center gap-4 rounded-md border border-copper/15 bg-navy-raised px-5 py-4 transition-all duration-(--t-base) ease-out-soft hover:-translate-y-0.5 hover:border-copper/40"
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <span className="icon-tile shrink-0 !bg-none !bg-navy-deep text-copper transition-transform duration-(--t-base) group-hover:scale-110">
                    <Dumbbell size={18} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-dark-1">{e.name}</p>
                    <p className="text-[11.5px] uppercase tracking-wider text-dark-3">{e.category}</p>
                  </div>
                  {e.qty > 1 && (
                    <span className="rounded-pill border border-copper/30 px-2.5 py-0.5 font-display text-[12px] font-extrabold text-copper">
                      ×{e.qty}
                    </span>
                  )}
                </m.li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-12">
            <EmptyNote dark icon={Dumbbell} text="Full equipment list coming soon — the floor speaks for itself in person." />
          </div>
        )}

        {/* amenities — a quiet constellation beneath the iron */}
        {amenities.length > 0 && (
          <div className="mt-16 border-t border-white/10 pt-12">
            <m.p className="eyebrow" {...rise(0)}>Everything handled</m.p>
            <ul className="mt-7 flex flex-wrap gap-x-9 gap-y-6">
              {amenities.map((f, i) => {
                const Icon = FACILITY_ICONS[f.id] ?? Dumbbell
                return (
                  <m.li key={f.id} className="flex items-center gap-3" {...rise(0.05 + Math.min(i, 8) * 0.045, 14)}>
                    <span className="grid size-10 place-items-center rounded-[12px] border border-copper/25 text-copper">
                      <Icon size={17} aria-hidden />
                    </span>
                    <span className="text-[14px] font-semibold text-dark-2">{f.label}</span>
                  </m.li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
