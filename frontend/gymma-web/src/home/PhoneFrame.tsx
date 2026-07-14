import type { ReactNode } from 'react'
import { Apple, Bell, CheckCircle2, Dumbbell, Flame, TrendingUp } from 'lucide-react'
import { cn } from '../lib/cn'

/*
 * The member app, shown not described. Four screens built from the
 * design system — every pixel is the actual brand, no stock mockups.
 * The app is white-labelled: these screens wear a GYM's identity
 * ("Fit District"), with Gymma underneath. That IS the pitch.
 */

export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative aspect-[9/19] w-[280px] overflow-hidden rounded-[38px] border-[6px] border-navy-deep bg-paper shadow-lg',
        className,
      )}
      aria-hidden
    >
      <div className="absolute left-1/2 top-2 z-10 h-[18px] w-[86px] -translate-x-1/2 rounded-pill bg-navy-deep" />
      {children}
    </div>
  )
}

function ScreenShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex h-full flex-col bg-paper pt-9">
      <div className="flex items-center justify-between px-4 pb-2">
        <div>
          <p className="font-expanded text-[13px] font-black text-navy">FIT DISTRICT</p>
          <p className="text-[9.5px] text-muted">{title}</p>
        </div>
        <span className="grid size-7 place-items-center rounded-full bg-navy text-[10px] font-black text-white">A</span>
      </div>
      <div className="min-h-0 flex-1 space-y-2.5 overflow-hidden px-4 pb-4">{children}</div>
      <div className="border-t border-line px-4 py-2 text-center text-[8px] font-semibold tracking-wide text-muted">
        POWERED BY GYMMA
      </div>
    </div>
  )
}

export function ScreenWorkout() {
  return (
    <ScreenShell title="Today's workout · Push day">
      <div className="rounded-[14px] bg-gradient-brand p-3 text-white">
        <p className="text-[9px] font-bold uppercase tracking-wider text-white/70">Week 6 · Day 3</p>
        <p className="mt-0.5 font-display text-[14px] font-extrabold">Chest & Triceps</p>
        <p className="text-[9.5px] text-white/80">5 exercises · ~48 min</p>
      </div>
      {[
        ['Bench Press', '4 × 8 · 60kg', true],
        ['Incline DB Press', '3 × 10 · 22kg', true],
        ['Cable Fly', '3 × 12', false],
        ['Overhead Extension', '3 × 12', false],
      ].map(([name, detail, done]) => (
        <div key={name as string} className="flex items-center gap-2.5 rounded-[12px] border border-line bg-white px-3 py-2">
          <CheckCircle2 size={15} className={done ? 'text-success' : 'text-line'} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10.5px] font-bold text-ink">{name}</p>
            <p className="text-[9px] text-muted">{detail}</p>
          </div>
          <Dumbbell size={12} className="text-copper" aria-hidden />
        </div>
      ))}
    </ScreenShell>
  )
}

export function ScreenNutrition() {
  return (
    <ScreenShell title="Nutrition · Tuesday">
      <div className="rounded-[14px] border border-line bg-white p-3">
        <div className="flex items-baseline justify-between">
          <p className="text-[10px] font-bold text-ink">1,840 / 2,200 kcal</p>
          <p className="text-[9px] text-success">on track</p>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-line">
          <div className="h-full w-[84%] rounded-pill bg-gradient-brand" />
        </div>
        <div className="mt-2 flex justify-between text-[8.5px] text-muted">
          <span>P 128g</span><span>C 190g</span><span>F 54g</span>
        </div>
      </div>
      {[
        ['Breakfast', '3 idli · sambar · filter coffee', '410'],
        ['Lunch', '2 roti · dal · paneer sabzi', '620'],
        ['Snack', 'Banana · whey shake', '310'],
        ['Dinner', 'Curd rice · salad', '500'],
      ].map(([meal, items, kcal]) => (
        <div key={meal as string} className="flex items-center gap-2.5 rounded-[12px] border border-line bg-white px-3 py-2">
          <Apple size={13} className="text-copper" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold text-ink">{meal}</p>
            <p className="truncate text-[9px] text-muted">{items}</p>
          </div>
          <p className="text-[9px] font-bold text-muted">{kcal}</p>
        </div>
      ))}
    </ScreenShell>
  )
}

export function ScreenAnnouncements() {
  return (
    <ScreenShell title="Announcements">
      {[
        ['New: Saturday mobility batch', '6:30am with Coach Meera. 12 spots.', 'copper'],
        ['Holiday hours — Diwali', 'Open 7am–1pm on Nov 12.', 'navy'],
        ['Deadlift workshop', 'Form clinic this Sunday. Free for members.', 'navy'],
      ].map(([title, body, tone]) => (
        <div key={title as string} className="rounded-[12px] border border-line bg-white p-3">
          <div className="flex items-center gap-2">
            <Bell size={12} className={tone === 'copper' ? 'text-copper' : 'text-muted'} aria-hidden />
            <p className="text-[10.5px] font-bold text-ink">{title}</p>
          </div>
          <p className="mt-1 text-[9px] leading-relaxed text-muted">{body}</p>
        </div>
      ))}
      <div className="rounded-[12px] bg-navy-deep p-3">
        <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-copper">
          <Flame size={11} aria-hidden /> 12-day streak
        </p>
        <p className="mt-1 text-[10px] text-dark-2">You've trained 12 days in a row. Keep it alive.</p>
      </div>
    </ScreenShell>
  )
}

export function ScreenProgress() {
  const bars = [42, 48, 45, 56, 61, 58, 70]
  return (
    <ScreenShell title="Progress · Bench press">
      <div className="rounded-[14px] border border-line bg-white p-3">
        <div className="flex items-baseline justify-between">
          <p className="text-[10px] font-bold text-ink">Est. 1RM</p>
          <p className="flex items-center gap-1 text-[10px] font-bold text-success">
            <TrendingUp size={11} aria-hidden /> +14kg
          </p>
        </div>
        <p className="mt-0.5 font-expanded text-[22px] font-black text-navy">
          82<span className="text-[11px] text-muted">kg</span>
        </p>
        <div className="mt-2 flex h-[64px] items-end gap-1.5">
          {bars.map((h, i) => (
            <div
              key={i}
              className={cn('flex-1 rounded-t-[4px]', i === bars.length - 1 ? 'bg-gradient-brand' : 'bg-line')}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[8px] text-muted"><span>W1</span><span>W7</span></div>
      </div>
      <div className="rounded-[12px] border border-line bg-white p-3">
        <p className="text-[10px] font-bold text-ink">This month</p>
        <div className="mt-1.5 grid grid-cols-3 gap-2 text-center">
          {[['18', 'workouts'], ['42k', 'kg lifted'], ['6', 'PRs']].map(([v, l]) => (
            <div key={l}>
              <p className="font-expanded text-[15px] font-black text-copper-dark">{v}</p>
              <p className="text-[8px] text-muted">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </ScreenShell>
  )
}

export const APP_SCREENS = [
  { key: 'workout', label: 'AI Workout Planner', desc: 'Smart plans personalised to every member — level, goal, and the equipment your gym actually has.', Screen: ScreenWorkout },
  { key: 'nutrition', label: 'Nutrition Tracking', desc: 'Log meals and macros — roti, dal, idli, all of it. An Indian food database, not a translated one.', Screen: ScreenNutrition },
  { key: 'announce', label: 'Broadcast Messaging', desc: 'Updates, events, holiday hours — delivered in your app, never lost in a 200-message group chat.', Screen: ScreenAnnouncements },
  { key: 'progress', label: 'Progress Tracking', desc: 'Members watch themselves get stronger, week by week. Progress they can see is progress that stays.', Screen: ScreenProgress },
] as const
