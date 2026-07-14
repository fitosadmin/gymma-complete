import { Plus, Trash2 } from 'lucide-react'
import { Button, Chip, Input, Select, Textarea } from '../../components/ui'
import { CERTIFICATIONS, SPECIALIZATIONS } from '../catalog'
import { uid } from '../types'
import type { Trainer } from '../types'
import { useBuilder } from '../store'
import { StepShell, UploadTile } from './shared'

export function StepTrainers() {
  const { draft, update } = useBuilder()

  function addTrainer() {
    const t: Trainer = {
      id: uid(),
      photo: null,
      name: '',
      experienceYears: null,
      certifications: [],
      specialization: SPECIALIZATIONS[0],
      bio: '',
      instagram: '',
    }
    update('trainers', (prev) => [...prev, t])
  }

  function patch(id: string, p: Partial<Trainer>) {
    update('trainers', (prev) => prev.map((t) => (t.id === id ? { ...t, ...p } : t)))
  }

  function remove(id: string) {
    update('trainers', (prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <StepShell
      step="Step 8 · Trainers"
      title="The people behind the results"
      sub="Your coaches become the face members trust. Certifications ARE the design here."
      tip="A real photo beats a perfect bio. Members join people, not machines."
    >
      {draft.trainers.map((t, i) => (
        <div key={t.id} className="rounded-md border border-line bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-h3 text-ink">{t.name || `Trainer ${i + 1}`}</h3>
            <button
              type="button"
              aria-label="Remove trainer"
              onClick={() => remove(t.id)}
              className="grid size-9 place-items-center rounded-full text-muted hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
            >
              <Trash2 size={16} aria-hidden />
            </button>
          </div>
          <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
            <UploadTile label="Photo" value={t.photo} onChange={(photo) => patch(t.id, { photo })} aspect="aspect-[3/4]" maxDim={640} />
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Name *" placeholder="Arjun Rao" value={t.name} onChange={(e) => patch(t.id, { name: e.target.value })} />
                <Input
                  label="Experience (years)"
                  inputMode="numeric"
                  placeholder="6"
                  value={t.experienceYears ?? ''}
                  onChange={(e) => patch(t.id, { experienceYears: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : null })}
                />
              </div>
              <Select label="Specialization" value={t.specialization} onChange={(e) => patch(t.id, { specialization: e.target.value })}>
                {SPECIALIZATIONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
              <div>
                <p className="mb-2 font-display text-[13px] font-bold text-ink">Certifications</p>
                <div className="flex flex-wrap gap-2">
                  {CERTIFICATIONS.map((c) => (
                    <Chip
                      key={c}
                      selected={t.certifications.includes(c)}
                      onClick={() =>
                        patch(t.id, {
                          certifications: t.certifications.includes(c)
                            ? t.certifications.filter((x) => x !== c)
                            : [...t.certifications, c],
                        })
                      }
                    >
                      {c}
                    </Chip>
                  ))}
                </div>
              </div>
              <Textarea label="Short bio" rows={2} placeholder="Coaching style, results, story…" value={t.bio} onChange={(e) => patch(t.id, { bio: e.target.value })} />
              <Input label="Instagram" placeholder="@coach.arjun" value={t.instagram} onChange={(e) => patch(t.id, { instagram: e.target.value })} />
            </div>
          </div>
        </div>
      ))}

      <Button variant="secondary" onClick={addTrainer}>
        <Plus size={16} aria-hidden className="mr-1" /> Add {draft.trainers.length ? 'another' : 'a'} trainer
      </Button>
    </StepShell>
  )
}
