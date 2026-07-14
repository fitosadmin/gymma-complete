import { Checkbox, Input, Toggle } from '../../components/ui'
import { DAY_LABELS } from '../types'
import { useBuilder } from '../store'
import { StepShell } from './shared'

export function StepLocation() {
  const { draft, update } = useBuilder()
  const loc = draft.location
  const set = (patch: Partial<typeof loc>) => update('location', (prev) => ({ ...prev, ...patch }))

  function setHour(i: number, patch: Partial<(typeof loc.hours)[number]>) {
    update('location', (prev) => ({
      ...prev,
      hours: prev.hours.map((h, idx) => (idx === i ? { ...h, ...patch } : h)),
    }))
  }

  return (
    <StepShell
      step="Step 2 · Location"
      title="Where do members find you?"
      sub="Address, landmark and working hours — the practical stuff that fills your page's map section."
      tip="Add a landmark ('Near Metro Pillar 55') — in India it beats a pin code every time."
    >
      <Input label="Address *" placeholder="12, 4th Cross, Indiranagar" value={loc.address} onChange={(e) => set({ address: e.target.value })} />
      <div className="grid gap-6 sm:grid-cols-2">
        <Input label="Landmark" placeholder="Near Metro Pillar 55" value={loc.landmark} onChange={(e) => set({ landmark: e.target.value })} />
        <Input label="Google Maps link" placeholder="https://maps.app.goo.gl/…" value={loc.mapsUrl} onChange={(e) => set({ mapsUrl: e.target.value })} />
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        <Input label="City *" placeholder="Bengaluru" value={loc.city} onChange={(e) => set({ city: e.target.value })} />
        <Input label="State" placeholder="Karnataka" value={loc.state} onChange={(e) => set({ state: e.target.value })} />
        <Input
          label="PIN code"
          placeholder="560038"
          inputMode="numeric"
          value={loc.pincode}
          onChange={(e) => set({ pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
        />
      </div>
      <Checkbox label="Parking available" checked={loc.parking} onChange={(e) => set({ parking: e.target.checked })} />

      <div>
        <p className="mb-3 font-display text-[13px] font-bold text-ink">Working hours</p>
        <div className="divide-y divide-line rounded-md border border-line bg-card">
          {loc.hours.map((h, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
              <span className="w-10 font-display text-[13px] font-bold text-ink">{DAY_LABELS[i]}</span>
              <Toggle label={h.closed ? 'Closed' : 'Open'} checked={!h.closed} onChange={(e) => setHour(i, { closed: !e.target.checked })} />
              {!h.closed && (
                <span className="ml-auto flex items-center gap-2">
                  <input
                    type="time"
                    aria-label={`${DAY_LABELS[i]} opening time`}
                    value={h.open}
                    onChange={(e) => setHour(i, { open: e.target.value })}
                    className="h-10 rounded-sm border border-line bg-white px-2 text-[14px] focus:border-copper focus:outline-none focus:ring-[3px] focus:ring-copper/12"
                  />
                  <span className="text-muted">–</span>
                  <input
                    type="time"
                    aria-label={`${DAY_LABELS[i]} closing time`}
                    value={h.close}
                    onChange={(e) => setHour(i, { close: e.target.value })}
                    className="h-10 rounded-sm border border-line bg-white px-2 text-[14px] focus:border-copper focus:outline-none focus:ring-[3px] focus:ring-copper/12"
                  />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </StepShell>
  )
}
