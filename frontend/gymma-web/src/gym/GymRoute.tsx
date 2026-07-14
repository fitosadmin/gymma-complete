import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { GymPage } from './GymPage'
import type { GymMeta } from './GymPage'
import { getPublishedGym } from './publishStore'
import { DEMO_GYMS, getDemoGymDraft } from '../home/demoGyms'
import { NotFoundPage } from '../pages/NotFoundPage'

const DEFAULT_TITLE = 'Gymma — Where Every Rep Builds Trust'

export function GymRoute() {
  const { slug } = useParams<{ slug: string }>()
  // owner-published gyms win; curated demo gyms back the featured flow
  const gym = slug ? (getPublishedGym(slug) ?? getDemoGymDraft(slug)) : null
  const demo = DEMO_GYMS.find((d) => d.slug === slug)
  const meta: GymMeta | undefined = demo
    ? { tier: demo.tier, rating: demo.rating, reviews: demo.reviews, sampleReviews: demo.sampleReviews }
    : undefined

  useEffect(() => {
    if (!gym) return
    document.title =
      gym.seo.metaTitle || `${gym.basics.name} — ${gym.location.city || 'India'} | Gymma`
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [gym])

  if (!gym) return <NotFoundPage gymSlug />
  return <GymPage gym={gym} meta={meta} />
}
