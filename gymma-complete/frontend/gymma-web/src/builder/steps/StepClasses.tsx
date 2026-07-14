import { Trash2 } from 'lucide-react'
import { Chip, Input } from '../../components/ui'
import { CLASS_TYPES } from '../catalog'
import { DAY_LABELS, uid } from '../types'
import type { GymClass } from '../types'
import { useBuilder } from '../store'
import { StepShell } from './shared'

export function StepClasses() {
  const { draft, update } = useBuilder()

  function addClass(name: string) {
    update('classes', (prev) => {
      if (prev.some((c) => c.name === name)) return prev
      const cls: GymClass = { id: uid(), name, days: ['Mon', 'Wed', 'Fri'], time: '07:00', trainer: '', capacity: null }
      return [...prev, cls]
    })
  }

  function patch(id: string, p: Partial<GymClass>) {
    update('classes', (prev) => prev.map((c) => (c.id === id ? { ...c, ...p } : c)))
  }

  function remove(id: string) {
    update('classes', (prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <StepShell
      step="Step 7 · Classes"
      title="Group classes on the timetable"
      sub="Skip this if you don't run classes — the section simply won't appear on your page."
      tip="Morning slots (6–8am) are what working professionals scan for first."
    >
      <div className="flex flex-wrap gap-2.5">
        {CLASS_TYPES.map((c) => (
          <Chip key={c} selected={draft.classes.some((x) => x.name === c)} onClick={() => addClass(c)}>
            {c}
          </Chip>
        ))}
      </div>

      {draft.classes.map((c) => (
        <div key={c.id} className="rounded-md border border-line bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-h3 text-ink">{c.name}</h3>
            <button
              type="button"
              aria-label={`Remove ${c.name}`}
              onClick={() => remove(c.id)}
              className="grid size-9 place-items-center rounded-full text-muted hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
            >
              <Trash2 size={16} aria-hidden />
            </button>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            {DAY_LABELS.map((d) => (
              <Chip
                key={d}
                selected={c.days.includes(d)}
                onClick={() => patch(c.id, { days: c.days.includes(d) ? c.days.filter((x) => x !== d) : [...c.days, d] })}
              >
                {d}
              </Chip>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block font-display text-[13px] font-bold text-ink" htmlFor={`time-${c.id}`}>
                Time
              </label>
              <input
                id={`time-${c.id}`}
                type="time"
                value={c.time}
                onChange={(e) => patch(c.id, { time: e.target.value })}
                className="h-[52px] w-full rounded-sm border border-line bg-white px-4 text-base focus:border-copper focus:outline-none focus:ring-[3px] focus:ring-copper/12"
              />
            </div>
            <Input label="Trainer" placeholder="Coach name" value={c.trainer} onChange={(e) => patch(c.id, { trainer: e.target.value })} />
            <Input
              label="Capacity"
              inputMode="numeric"
              placeholder="20"
              value={c.capacity ?? ''}
              onChange={(e) => patch(c.id, { capacity: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : null })}
            />
          </div>
        </div>
      ))}
    </StepShell>
  )
}
