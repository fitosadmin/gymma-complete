# REDESIGN_PLAN.md

> Phase 0 deliverable. Written **after** a full read of every source file, **before** any code changes.
> Scope: frontend experience only. APIs, data models, routing, auth, and business logic are frozen.

---

## 1. Current project architecture

- **Framework:** Next.js 14.2 (App Router), React 18.3, TypeScript 5.5 (`strict: true`).
- **Styling:** Tailwind 3.4 driven entirely by CSS custom properties in `src/app/globals.css`. Tailwind colors/radii/shadows/fonts are *aliases* to those variables (`tailwind.config.ts`), so the whole theme is re-skinnable from `:root`. This is the single most important architectural fact: **the token layer already exists and works** — the redesign extends it, never bypasses it.
- **Type contract:** `src/types/gym.ts` (`GymSummary`, `GymDetail`, `Review`, etc.) and `src/types/api.ts` (`ApiResponse<T>`, `Paginated<T>`) mirror the backend §12 contract.
- **Data layer:** `src/lib/api.ts` is the single boundary. It `fetch`es a real backend at `NEXT_PUBLIC_API_URL` (default `http://localhost:3001/api/v1`) and runs every payload through `mapGym()` (backend→frontend field adapter: `coverImageUrl→coverImage`, `membershipPlans→plans`, `photoUrl→photo`, etc.). Mock data (`gyms.generated.ts`, 50 real Bengaluru gyms) still backs the header/hero typeahead and the map preview directly via `MOCK_GYMS`.
- **Fonts:** Inter Variable, self-hosted via `@fontsource-variable/inter`, exposed as `--font-inter`.
- **Animation libs present:** `framer-motion@11` (used only in `gym-carousel`). No GSAP/Lenis/Three — and the spec's "inspired by" list does **not** require adding them. Motion will be built on framer-motion + CSS, which is lighter and matches what's installed.
- **Build config:** `next.config.mjs` sets `eslint.ignoreDuringBuilds` and `typescript.ignoreBuildErrors` to `true`. Remote image hosts allow Cloudinary, Google Places, picsum.

## 2. Folder structure (relevant)

```
src/
  app/
    layout.tsx                root <html>, metadata, Inter, globals.css
    page.tsx                  redirect("/explore")
    globals.css               DESIGN TOKENS (source of truth)
    (consumer)/
      layout.tsx              Header + <main pt-16> + Footer
      about/ compare/ explore/ partner-with-us/ privacy/ terms/
      search/                 server component → SearchExperience
      gym/[slug]/             SSG page + not-found
      owner/ login|onboarding|dashboard/
  components/
    common/  header, footer
    landing/ hero, stats-bar, section-header, gym-grid, map-preview,
             why-choose-us, owner-cta, contact-section, discovery
    gym/     gym-card, gym-card-compact, gym-image, featured-row, directions-button
    gym-detail/ gym-carousel, actions, about, gallery, trainers-row, plans,
             facilities-grid, classes-list, reviews-section, scores-card, inquiry
    search/  search-experience, gym-row
    compare/ compare-tool
    map/     gym-map (dynamic, ssr:false), leaflet-map
    owner/   announcement-composer, demo-form, members-tab
    ui/      button, input, card, badge, star-rating, skeleton, modal,
             accordion, lightbox   ← primitives
  lib/   api, auth, utils, amenity-icons, mock-data, mock-detail, gyms.generated
  types/ gym, api
```

## 3. Route map

| Route | Render | Data source | Notes |
|---|---|---|---|
| `/` | redirect | — | → `/explore` |
| `/explore` | **client** | `getFeatured()` in `useEffect` | landing; blocks on `"Loading gyms..."` |
| `/search` | server | `getGyms({limit:500})` | wraps `SearchExperience` (client) |
| `/gym/[slug]` | **SSG** | `getGymBySlug` + `getReviews` + `generateStaticParams` | JSON-LD, metadata, sticky bottom bar |
| `/compare` | server | `getAllGymDetails()` | N+1 detail fetch (perf risk) |
| `/about` | static | const arrays | marketing |
| `/partner-with-us` | static | const arrays | owner landing + `DemoForm` |
| `/owner/login` | client | Google OAuth | localStorage session |
| `/owner/onboarding` | client | auth-gated | multi-step form |
| `/owner/dashboard` | client | `listOwnerGyms` | auth-gated, tabs |
| `/privacy`, `/terms` | static | inline | legal prose |

## 4. Shared component map (reuse hotspots)

- `ui/Button` — used in actions, plans, inquiry, owner, not-found. **Highest-leverage primitive.**
- `gym/GymCard` — explore grids, search rows. The product's signature unit.
- `gym/GymImage` — every image surface; gradient placeholder + `next/image` swap.
- `ui/Modal` — inquiry. `ui/Accordion` — gym FAQ + partner FAQ. `ui/Lightbox` — gallery.
- `landing/SectionHeader` — every explore section.
- `map/GymMap` — explore preview, search map view, discovery.

## 5. Current design language

Editorial, photo-first, light-mode only. Near-black **ink** (`#0a0a0a`) is the primary action color; a single **orange** (`#f97316`) is the deliberate accent (logo, accent word, "01–04" steps, active states); functional **green** (open/health) and **amber** (ratings). Generous whitespace, `max-w-7xl` containers, rounded cards, soft shadows. It's already tasteful and coherent — **not** a Bootstrap dashboard. The redesign's job is to push it from "clean and competent" to "premium and memorable," not to reinvent it.

## 6. Current UX problems

1. **`/explore` blocks on a full-screen `"Loading gyms..."` string** while client-side `getFeatured()` runs — no skeletons, poor LCP/CLS, jarring.
2. **Two different search inputs** (header overlay vs hero) with **divergent behavior** and styling — inconsistent mental model.
3. **No global route-transition feedback**; navigation feels instant-but-flat.
4. **`/compare` does an N+1 fetch** (one list call + one detail call per gym) before first paint — slow, and no skeleton.
5. **Mobile bottom bars collide:** gym-detail `BottomBar` and discovery's floating list/map toggle both sit `bottom`, z-40, and could overlap on some flows.
6. **Owner pages use a different visual dialect** (`bg-gray-50`, `blue-600`, raw `border-neutral-300` inputs) — off-brand vs the rest of the app.
7. **Empty/error states are thin** (search has one; explore/compare/reviews lack them).

## 7. Current UI problems

- Typography is competent but flat: headings rely on raw Tailwind sizes in pages (`text-5xl`, `text-4xl`) instead of the token scale (`text-display/h1/h2`), so hierarchy drifts page to page.
- Inconsistent radii: cards mix `rounded-lg`, `rounded-xl`, `rounded-2xl`; the token scale exists but isn't applied uniformly.
- Hover states are mostly color/shadow; little depth, motion, or "craft" moment.
- Hero is text-only on a white field — competent but not "cinematic"; no imagery, depth, or motion to convey energy/athleticism.
- Accent orange is sometimes used as a fill on large surfaces (logo chip, hero word) but underused as a *system* (focus, progress, selection share it inconsistently).

## 8. Responsiveness issues

- Hero search collapses to stacked inputs with a hard `min-width:180px` inline style on the location button — brittle on ~360px screens.
- `compare-tool` is horizontal-scroll on mobile (acceptable) but the sticky label column + first data column can feel cramped; header has no scroll affordance.
- `search-experience` filter sidebar is desktop-only (`hidden lg:block`) — **mobile users cannot filter at all** (no drawer). Functional gap to preserve-and-improve via a mobile filter sheet (UI-only).
- Some fixed bars don't reserve safe-area padding (iOS notch).

## 9. Accessibility issues

- Good baseline: `:focus-visible` ring globally, reduced-motion media query, ARIA on modal/lightbox/star-rating/switch.
- Gaps: Modal/Lightbox **don't trap focus** or restore focus on close; carousel autoplay has no pause-on-focus and dots lack `aria-current`; several icon-only controls rely on color alone for state; `<select>` sort controls are fine but custom chips need `aria-pressed`; hero/search results dropdown isn't a proper combobox (no `aria-activedescendant`).
- Decorative gradient `GymImage` uses `role="img"` with a label — fine; but link "card" pattern (`after:absolute after:inset-0`) can swallow nested interactive buttons' a11y semantics — verify tab order.

## 10. Performance issues

- `/explore` is a **client component fetching in `useEffect`** → no SSR/streaming, worse TTFB-to-content, blocks render. Candidate to convert to a server component with `<Suspense>` + skeletons (improves LCP) **without changing the data contract**.
- `/compare` **N+1** detail fetch.
- `MOCK_GYMS` (50 gyms, long Google photo URLs, ~370 KB file) is imported into client bundles via header + hero + map-preview. Heavy client payload for a typeahead.
- `leaflet` + `react-leaflet` already correctly dynamic/`ssr:false`. Good.
- No `next/font` optimization for Inter (fontsource import loads full variable file); acceptable but worth noting.
- Images: Google Places `photoreference` URLs are huge and unoptimized through `next/image` `fill` with broad `sizes`.

## 11. Visual hierarchy issues

- On `/explore`, three near-identical gym grids stack with the same weight — no rhythm, no "hero moment," no editorial pacing.
- Stats bar, why-choose-us, contact all use centered headers of similar size → monotone vertical scroll.
- Gym-detail body is a flat `space-y-12` stack; no anchored sub-nav, no sticky summary, plans don't "pop" as the conversion moment.

## 12. User journey analysis

**Seeker:** `/explore` (discover) → search/typeahead → `/search` (filter/sort/map) → `/gym/[slug]` (evaluate: gallery, plans, reviews) → inquiry modal (convert) / directions. Optional `/compare` shortlist. **Primary conversion = the inquiry modal on the detail page.** That surface and the gym card (entry point) get the most polish budget.

**Owner:** `/partner-with-us` → demo form → `/owner/login` → `/owner/onboarding` → `/owner/dashboard`. Lower traffic; bring on-brand, don't over-invest.

## 13. Page-by-page redesign strategy (summary; full detail in UI_IMPROVEMENTS.md)

1. **Foundation** (tokens + motion primitives + Button/Card/Input/Badge polish) — touches everything, lands first.
2. **GymCard** — signature unit; image treatment, hierarchy, hover craft, motion.
3. **/explore** — cinematic hero, editorial section rhythm, skeletons, scroll reveals.
4. **/gym/[slug]** — sticky summary/sub-nav, plan emphasis, gallery + reviews polish, refined inquiry modal.
5. **/search** — unified search bar, mobile filter sheet, result skeletons, empty state.
6. **/compare** — sticky/legible table, highlight craft, skeleton.
7. **Owner surfaces** — rebrand login/onboarding/dashboard to the token system.
8. **Static** (about/partner/legal) — typographic polish, reveals.

## 14. Component redesign order

`tokens/globals.css` → `ui/Button` → `ui/Card`→`ui/Input`→`ui/Badge`→`ui/Skeleton` → motion primitives (`Reveal`, `PageTransition`) → `GymCard`/`GymImage` → `SectionHeader` → `Hero` → detail components → `Modal`/`Lightbox` (a11y) → search/compare/owner.

## 15. Development phases (gated)

| Phase | Theme | Exit gate |
|---|---|---|
| P0 | Reverse-engineer + these docs | ✅ this deliverable |
| P1 | Foundation: tokens + motion primitives + primitives polish | build+typecheck green; visual parity preserved |
| P2 | GymCard + explore | green; explore LCP improved |
| P3 | gym/[slug] + inquiry + modal/lightbox a11y | green; conversion surface polished |
| P4 | search + compare | green; mobile filter works |
| P5 | owner + static | green; fully on-brand |
| P6 | Perf + a11y sweep (PERFORMANCE_CHECKLIST) | Lighthouse ≥ baseline, no regressions |

Each phase: **explain understanding → problems → solution → implement → verify (build, typecheck, responsiveness, a11y) → proceed.** Never combine phases.

## 16. Risk analysis

- **No backend in this environment** → SSG/server fetches fail (`ECONNREFUSED`). Mitigation: a throwaway local mock API on `:3001` serving `gyms.generated.ts` shapes **for build verification only** (zero changes to `lib/api.ts`). Confirmed the repo already has all data needed.
- **Token drift:** pages hardcode colors/sizes. Risk that "improvements" invent new tokens. Mitigation: DESIGN_SYSTEM.md is authoritative; only extend `:root`.
- **Breaking the card link pattern** (`after:inset-0`) when adding motion wrappers. Mitigation: keep the anchor overlay, animate the container, test tab/click.
- **Carousel rewrite risk:** `gym-carousel` uses delicate imperative transforms. Treat as polish-in-place, not rewrite.
- **Map:** Leaflet is functional; restyling pins is low-risk, swapping providers is out of scope.

## 17. Estimated effort (relative)

P1 ~M · P2 ~M · P3 ~L · P4 ~M · P5 ~M · P6 ~S. Largest single surface: gym-detail (P3).

## 18. Priority matrix (impact × reach)

- **High impact / high reach:** tokens+primitives (P1), GymCard (P2), explore hero+skeletons (P2). → do first.
- **High impact / focused reach:** gym-detail + inquiry (P3). → do second.
- **Medium:** search mobile filters, compare legibility (P4).
- **Lower:** owner rebrand, static polish (P5). Motion is woven through every phase, not a separate one.
