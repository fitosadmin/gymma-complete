import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Chip, Input } from '../../components/ui'
import { EQUIPMENT_CATALOG, EQUIPMENT_CATEGORIES } from '../catalog'
import { uid } from '../types'
import { useBuilder } from '../store'
import { StepShell } from './shared'

export function StepEquipment() {
  const { draft, update } = useBuilder()
  const [query, setQuery] = useState('')
  const [activeCat, setActiveCat] = useState<string>('All')

  const selectedByName = new Map(draft.equipment.map((e) => [e.name, e]))
  const visible = EQUIPMENT_CATALOG.filter(
    (e) =>
      (activeCat === 'All' || e.category === activeCat) &&
      e.name.toLowerCase().includes(query.toLowerCase()),
  )

  function toggle(name: string, category: string) {
    update('equipment', (prev) =>
      prev.some((e) => e.name === name)
        ? prev.filter((e) => e.name !== name)
        : [...prev, { id: uid(), name, category, qty: 1 }],
    )
  }

  function setQty(name: string, delta: number) {
    update('equipment', (prev) =>
      prev.map((e) => (e.name === name ? { ...e, qty: Math.max(1, Math.min(99, e.qty + delta)) } : e)),
    )
  }

  return (
    <StepShell
      step="Step 5 · Equipment"
      title="What's on your floor?"
      sub="Tap to add. Serious lifters read this section first — dumbbells up to 50kg says more than any adjective."
      tip="Quantities matter for cardio: '8 treadmills' tells members they won't wait in line."
    >
      <Input label="Search equipment" placeholder="Treadmill, squat rack…" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        {['All', ...EQUIPMENT_CATEGORIES].map((c) => (
          <Chip key={c} selected={activeCat === c} onClick={() => setActiveCat(c)}>
            {c}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-2.5">
        {visible.map((e) => {
          const sel = selectedByName.get(e.name)
          return (
            <span key={e.name} className="inline-flex items-center">
              <Chip selected={!!sel} onClick={() => toggle(e.name, e.category)}>
                {e.name}
              </Chip>
              {sel && (
                <span className="ml-1 inline-flex items-center gap-0.5 rounded-pill border border-copper/40 bg-copper/8 px-1">
                  <button type="button" aria-label={`Fewer ${e.name}`} onClick={() => setQty(e.name, -1)} className="grid size-6 place-items-center text-copper-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper rounded-full">
                    <Minus size={12} aria-hidden />
                  </button>
                  <span className="min-w-5 text-center text-[12px] font-bold text-copper-dark">{sel.qty}</span>
                  <button type="button" aria-label={`More ${e.name}`} onClick={() => setQty(e.name, 1)} className="grid size-6 place-items-center text-copper-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper rounded-full">
                    <Plus size={12} aria-hidden />
                  </button>
                </span>
              )}
            </span>
          )
        })}
      </div>
      <p className="text-caption text-muted">{draft.equipment.length} items on your page</p>
    </StepShell>
  )
}
