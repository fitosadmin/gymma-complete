import { Input, Textarea } from '../../components/ui'
import { slugify } from '../types'
import { useBuilder } from '../store'
import { StepShell } from './shared'

export function StepSeo() {
  const { draft, update } = useBuilder()
  const s = draft.seo
  const set = (patch: Partial<typeof s>) => update('seo', (prev) => ({ ...prev, ...patch }))

  const autoSlug = slugify(draft.basics.name) || 'your-gym'
  const autoTitle = draft.basics.name ? `${draft.basics.name} — ${draft.location.city || 'India'} | Gymma` : ''
  const autoDesc = draft.basics.description.slice(0, 155)

  return (
    <StepShell
      step="Step 11 · Your web address"
      title="Claim your Gymma URL"
      sub="We've pre-filled everything from what you already told us. Most owners change nothing here."
      tip="Short URLs look better on posters and QR codes. You can leave every field on auto."
    >
      <div>
        <Input
          label="Gym URL"
          placeholder={autoSlug}
          value={s.slug}
          onChange={(e) => set({ slug: slugify(e.target.value) })}
        />
        <p className="mt-1.5 text-caption text-muted">
          Your page: <span className="font-semibold text-copper-dark">gymma.com/gym/{s.slug || autoSlug}</span>
        </p>
      </div>
      <Input label="Meta title" placeholder={autoTitle || 'Auto-generated from your gym name'} value={s.metaTitle} onChange={(e) => set({ metaTitle: e.target.value })} />
      <Textarea label="Meta description" rows={3} placeholder={autoDesc || 'Auto-generated from your description'} value={s.metaDescription} onChange={(e) => set({ metaDescription: e.target.value })} />
      <Input label="Keywords" placeholder="gym in indiranagar, crossfit bengaluru" value={s.keywords} onChange={(e) => set({ keywords: e.target.value })} />
    </StepShell>
  )
}
