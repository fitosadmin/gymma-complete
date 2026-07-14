import { Input } from '../../components/ui'
import { useBuilder } from '../store'
import { StepShell } from './shared'

export function StepSocial() {
  const { draft, update } = useBuilder()
  const s = draft.social
  const set = (patch: Partial<typeof s>) => update('social', (prev) => ({ ...prev, ...patch }))

  return (
    <StepShell
      step="Step 10 · Contact & social"
      title="How do members reach you?"
      sub="Phone and WhatsApp power the Call and Join buttons across your page."
      tip="In India, a WhatsApp number converts better than any contact form."
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Input label="Phone *" inputMode="tel" placeholder="95912 76584" value={s.phone} onChange={(e) => set({ phone: e.target.value })} />
        <Input label="WhatsApp" inputMode="tel" placeholder="Same as phone?" value={s.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} />
        <Input label="Email" type="email" placeholder="hello@ironhouse.in" value={s.email} onChange={(e) => set({ email: e.target.value })} />
        <Input label="Website" placeholder="https://…" value={s.website} onChange={(e) => set({ website: e.target.value })} />
        <Input label="Instagram" placeholder="@ironhouse.fit" value={s.instagram} onChange={(e) => set({ instagram: e.target.value })} />
        <Input label="Facebook" placeholder="facebook.com/ironhouse" value={s.facebook} onChange={(e) => set({ facebook: e.target.value })} />
        <Input label="YouTube" placeholder="youtube.com/@ironhouse" value={s.youtube} onChange={(e) => set({ youtube: e.target.value })} />
      </div>
    </StepShell>
  )
}
