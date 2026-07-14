import { Trash2 } from 'lucide-react'
import { Chip, Input, Toggle } from '../../components/ui'
import { PLAN_PRESETS } from '../catalog'
import { uid } from '../types'
import type { MembershipPlan } from '../types'
import { useBuilder } from '../store'
import { StepShell } from './shared'

export function StepPlans() {
  const { draft, update } = useBuilder()

  function addPreset(name: string, durationMonths: number) {
    update('plans', (prev) => {
      if (prev.some((p) => p.name === name)) return prev
      const plan: MembershipPlan = {
        id: uid(),
        name,
        durationMonths,
        price: null,
        joiningFee: null,
        benefits: [],
        popular: prev.length === 1, // second plan added defaults to popular
        offer: '',
      }
      return [...prev, plan]
    })
  }

  function patch(id: string, p: Partial<MembershipPlan>) {
    update('plans', (prev) =>
      prev.map((x) => {
        if (x.id !== id) return p.popular ? { ...x, popular: false } : x
        return { ...x, ...p }
      }),
    )
  }

  function remove(id: string) {
    update('plans', (prev) => prev.filter((x) => x.id !== id))
  }

  return (
    <StepShell
      step="Step 6 · Membership plans"
      title="Your prices, out in the open"
      sub="Hidden costs are the #1 fear of gym seekers. Transparent pricing converts."
      tip="Mark one plan as Popular — it gets the copper border and most of the clicks."
    >
      <div>
        <p className="mb-2 font-display text-[13px] font-bold text-ink">Add a plan</p>
        <div className="flex flex-wrap gap-2.5">
          {PLAN_PRESETS.map((p) => (
            <Chip
              key={p.name}
              selected={draft.plans.some((x) => x.name === p.name)}
              onClick={() => addPreset(p.name, p.durationMonths)}
            >
              {p.name}
            </Chip>
          ))}
        </div>
      </div>

      {draft.plans.map((p) => (
        <div key={p.id} className="rounded-md border border-line bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-h3 text-ink">{p.name}</h3>
            <div className="flex items-center gap-4">
              <Toggle label="Popular" checked={p.popular} onChange={(e) => patch(p.id, { popular: e.target.checked })} />
              <button
                type="button"
                aria-label={`Remove ${p.name} plan`}
                onClick={() => remove(p.id)}
                className="grid size-9 place-items-center rounded-full text-muted hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
              >
                <Trash2 size={16} aria-hidden />
              </button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Price (₹) *"
              inputMode="numeric"
              placeholder="1500"
              value={p.price ?? ''}
              onChange={(e) => patch(p.id, { price: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : null })}
            />
            <Input
              label="Joining fee (₹)"
              inputMode="numeric"
              placeholder="500"
              value={p.joiningFee ?? ''}
              onChange={(e) => patch(p.id, { joiningFee: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : null })}
            />
            <Input
              label="Offer banner"
              placeholder="2 months free!"
              value={p.offer}
              onChange={(e) => patch(p.id, { offer: e.target.value })}
            />
          </div>
          <div className="mt-4">
            <Input
              label="Benefits (comma-separated)"
              placeholder="All equipment, Group classes, Diet consult"
              value={p.benefits.join(', ')}
              onChange={(e) =>
                patch(p.id, { benefits: e.target.value.split(',').map((s) => s.trimStart()).filter((s, i, a) => s || i < a.length - 1) })
              }
            />
          </div>
        </div>
      ))}
    </StepShell>
  )
}
