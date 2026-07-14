import { useState } from 'react'
import { Input } from '../../components/ui'
import { FACILITIES } from '../catalog'
import { useBuilder } from '../store'
import { SelectCard, StepShell } from './shared'

export function StepFacilities() {
  const { draft, update } = useBuilder()
  const [query, setQuery] = useState('')

  const visible = FACILITIES.filter((f) => f.label.toLowerCase().includes(query.toLowerCase()))

  function toggle(id: string) {
    update('facilities', (prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <StepShell
      step="Step 4 · Facilities"
      title="What do you offer?"
      sub="Tap everything that applies. Only what you select appears on your page — nothing shows as 'missing'."
      tip="A women's section and parking are two of the most-filtered amenities on Gymma."
    >
      <Input label="Search facilities" placeholder="Type to filter…" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visible.map((f) => (
          <SelectCard key={f.id} selected={draft.facilities.includes(f.id)} onToggle={() => toggle(f.id)}>
            {f.label}
          </SelectCard>
        ))}
      </div>
      <p className="text-caption text-muted">{draft.facilities.length} selected</p>
    </StepShell>
  )
}
