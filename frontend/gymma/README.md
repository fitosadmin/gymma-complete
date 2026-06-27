# Gymma — Frontend

India-first gym discovery marketplace. Next.js 14 (App Router) · TypeScript · Tailwind.
Frontend-first with typed mock data shaped exactly like the real API.

## Design — "best of both"

Editorial, photo-first system: white + near-black **ink** as the primary action color,
with a single deliberate **orange accent** (logo mark, the hero's accent word, "01–04"
steps, active states) and functional green (open/positive) + amber (ratings). Driven by
**design tokens** in `src/app/globals.css` — re-theme from `:root`, never components.

## Run

```bash
npm install      # Node >= 18.17
npm run dev      # http://localhost:3000  (redirects to /explore)
```

Scripts: `npm run build`, `npm run start`, `npm run typecheck`.

## Pages (all linked routes complete)

- **`/explore`** — editorial hero (accent word + dual search w/ live suggestions), stats
  bar, curated grids, live map preview, "Why Gymma", owner-CTA banner, contact.
- **`/search`** — live list + Leaflet map, sort, mobile list/map toggle.
- **`/gym/[slug]`** — full detail (hero, chips, about, gallery + lightbox, trainers,
  plans + inquiry modal, facilities, classes, reviews + breakdown, FAQs, sticky CTA).
  SSG per gym + SEO metadata + HealthClub JSON-LD.
- **`/compare`** — side-by-side compare tool: add/remove up to 4 gyms; price, rating,
  reviews, distance, flags, category scores, amenities; best price/rating highlighted.
- **`/partner-with-us`** — owner landing ("list your gym"): two pillars, cost comparison,
  capabilities, onboarding steps, pricing tiers, FAQ, demo request form.
- **`/owner/dashboard`** — owner dashboard preview: profile completion, analytics cards,
  recent inquiries, broadcast composer, quick actions.

## Core UI & swap points

Primitives: Button (ink/accent/outline/ghost), Input, Card, Badge, StarRating, Skeleton,
Modal, Accordion, Lightbox. Typed contracts in `src/types/` mirror §12.

| Concern | Now | Later | Where |
|---|---|---|---|
| Data | mock | real `fetch('/api/v1/...')` | `src/lib/api.ts` |
| Images | gradient placeholders | Cloudinary → S3 | `src/components/gym/gym-image.tsx` |
| Map | Leaflet/OSM (live) | Mapbox/Google | `src/components/map/gym-map.tsx` |
| Theme | editorial tokens | any palette | `src/app/globals.css` |

## Next

Filter chips + empty state on Search, consent gate, member app surfaces, i18n
(en-IN/hi-IN), React Query + Zustand, React Hook Form + Zod, real auth for the dashboard.
