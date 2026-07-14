import type { GymDraft } from '../builder/types'

/* Published gyms live in localStorage until the backend lands.
   The shape is the GymDraft itself — template + content = site. */

const PUBLISHED_KEY = 'gymma.published'

type PublishedMap = Record<string, GymDraft>

function readAll(): PublishedMap {
  try {
    const raw = localStorage.getItem(PUBLISHED_KEY)
    if (raw) return JSON.parse(raw) as PublishedMap
  } catch {
    /* fall through */
  }
  return {}
}

export function publishGym(draft: GymDraft): string {
  const slug = draft.seo.slug
  const all = readAll()
  all[slug] = { ...draft, updatedAt: new Date().toISOString() }
  localStorage.setItem(PUBLISHED_KEY, JSON.stringify(all))
  return slug
}

export function getPublishedGym(slug: string): GymDraft | null {
  return readAll()[slug] ?? null
}
