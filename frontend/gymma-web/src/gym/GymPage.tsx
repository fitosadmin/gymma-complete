import type { GymDraft } from '../builder/types'
import type { GymMeta } from './shared'
import { GymHero } from './sections/GymHero'
import { GymNav } from './sections/GymNav'
import type { NavChip } from './sections/GymNav'
import { GymAbout } from './sections/GymAbout'
import { GymGallery } from './sections/GymGallery'
import { GymFloor } from './sections/GymFloor'
import { GymPeople } from './sections/GymPeople'
import { GymPlans } from './sections/GymPlans'
import { GymReviews } from './sections/GymReviews'
import { GymCta, GymFooter, GymLocation, StickyActionBar } from './sections/GymEnd'

export type { GymMeta } from './shared'

/*
 * THE universal gym website (Blueprint D11) — one template, pure data.
 * Narrative: identity → story → proof-by-imagery → the floor →
 * people → price → trust climax → logistics → the yes.
 * Sections with no content collapse; optional ones degrade to designed
 * placeholders. Zero gym-specific code, ever.
 */

interface GymPageProps {
  gym: GymDraft
  /** Builder preview pane: outbound links off, viewport-scale effects off */
  preview?: boolean
  /** Platform trust data (rating/tier/reviews) — absent for unrated gyms */
  meta?: GymMeta
}

export function GymPage({ gym, preview = false, meta }: GymPageProps) {
  const chips: NavChip[] = [
    (gym.basics.description || gym.basics.ownerName) && { id: 'about', label: 'About' },
    { id: 'gallery', label: 'Gallery' },
    (gym.equipment.length > 0 || gym.facilities.length > 0) && { id: 'floor', label: 'The Floor' },
    { id: 'classes', label: 'Classes' },
    { id: 'trainers', label: 'Coaches' },
    { id: 'plans', label: 'Membership' },
    { id: 'reviews', label: 'Reviews' },
    (gym.location.address || gym.location.city) && { id: 'location', label: 'Location' },
  ].filter(Boolean) as NavChip[]

  return (
    <div className="bg-paper text-ink">
      <GymHero gym={gym} meta={meta} preview={preview} />
      <GymNav chips={chips} />
      <GymAbout gym={gym} />
      <GymGallery gym={gym} preview={preview} />
      <GymFloor gym={gym} />
      <GymPeople gym={gym} />
      <GymPlans gym={gym} />
      <GymReviews gym={gym} meta={meta} />
      <GymLocation gym={gym} preview={preview} />
      <GymCta gym={gym} preview={preview} />
      <GymFooter gym={gym} preview={preview} />
      {!preview && <StickyActionBar gym={gym} />}
    </div>
  )
}
