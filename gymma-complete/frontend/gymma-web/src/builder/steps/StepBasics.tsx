import { Input, Select, Textarea } from '../../components/ui'
import { BUSINESS_CATEGORIES } from '../catalog'
import { useBuilder } from '../store'
import { StepShell, UploadTile } from './shared'

export function StepBasics() {
  const { draft, update } = useBuilder()
  const b = draft.basics
  const set = (patch: Partial<typeof b>) => update('basics', (prev) => ({ ...prev, ...patch }))

  return (
    <StepShell
      step="Step 1 · Basic information"
      title="Tell us about your gym"
      sub="This is the first thing visitors see — your name, your look, your story."
      tip="Gyms with a cover photo get far more profile visits. A wide shot of your training floor works best."
    >
      <Input
        label="Gym name *"
        placeholder="e.g. Iron House Fitness"
        value={b.name}
        onChange={(e) => set({ name: e.target.value })}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <UploadTile label="Logo *" value={b.logo} onChange={(logo) => set({ logo })} aspect="aspect-square" maxDim={480} />
        <UploadTile label="Cover image" value={b.cover} onChange={(cover) => set({ cover })} />
      </div>
      <Input
        label="Tagline"
        placeholder="e.g. Stronger every single day"
        value={b.tagline}
        onChange={(e) => set({ tagline: e.target.value })}
      />
      <Textarea
        label="Short description"
        placeholder="What makes your gym special? Community, coaching, results…"
        value={b.description}
        onChange={(e) => set({ description: e.target.value })}
      />
      <div className="grid gap-6 sm:grid-cols-3">
        <Input
          label="Founded year"
          placeholder="2018"
          inputMode="numeric"
          value={b.foundedYear}
          onChange={(e) => set({ foundedYear: e.target.value.replace(/\D/g, '').slice(0, 4) })}
        />
        <Input
          label="Owner name"
          placeholder="Priya Sharma"
          value={b.ownerName}
          onChange={(e) => set({ ownerName: e.target.value })}
        />
        <Select label="Category" value={b.category} onChange={(e) => set({ category: e.target.value })}>
          {BUSINESS_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </div>
    </StepShell>
  )
}
