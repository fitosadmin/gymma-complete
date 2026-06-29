# UI_IMPROVEMENTS.md

> Per-route redesign spec. Each route: current problems · visual/UX/a11y/animation/perf/interaction/hierarchy/type/spacing/color/component improvements · before→after · priority. Functionality, routes, APIs, and data are preserved throughout.

---

## `/explore` (landing) — Priority P2

**Current problems:** client component blocks on `"Loading gyms..."`; text-only hero on white (not cinematic); three identical gym grids with no rhythm; sections monotone.

- **Visual:** cinematic hero (depth via layered gradient/imagery + vignette, accent word on `--gradient-accent`); editorial section pacing (vary header scale/eyebrows); consistent card radius.
- **UX:** skeletons instead of blocking loader; single unified search behavior with header; clear scan­nable rhythm.
- **A11y:** one `h1` from `display` token; landmark sections; reveals respect reduced-motion.
- **Animation:** hero text reveal (600ms); section + card staggered scroll reveals (once); stats count-up; optional single subtle hero parallax (desktop).
- **Perf:** convert to **server component + `<Suspense>`** streaming the featured rails (no data-contract change), or keep client but add skeletons + defer map below fold; slim client `MOCK_GYMS` typeahead import.
- **Interaction:** typeahead parity with header; quick-tags animate.
- **Hierarchy/Type/Spacing:** hero dominant; section headers use `h2`+`caption` eyebrow; `py-20/24` rhythm.
- **Color:** orange reserved for accent word/CTA/active; ink for structure.
- **Components:** Hero, SectionHeader, GymGrid, GymCard, StatsBar, MapPreview.
- **Before→After:** flat white text page that flashes a loading string → cinematic, streamed, rhythmic landing that conveys energy and loads gracefully.

## `/gym/[slug]` (detail) — Priority P3 (largest surface)

**Current problems:** flat `space-y-12` stack; plans don't pop; no anchored summary/sub-nav; modal/lightbox a11y gaps.

- **Visual:** refine cover carousel framing + vignette; stronger identity block; plans as the visual climax (accent on recommended); polished reviews (animated distribution + scores).
- **UX:** optional sticky mini-summary (name+rating+price+Contact) on scroll (desktop) reinforcing the existing sticky mobile BottomBar; smooth in-page anchors to sections.
- **A11y:** Modal + Lightbox focus trap & restore; carousel pause-on-focus + fullscreen trap; accordion animated but semantic.
- **Animation:** section reveals; score/distribution bars fill on view; plan highlight transition; gallery image reveals; modal enter/exit.
- **Perf:** keep SSG + JSON-LD + metadata; tighten image `sizes`; ensure carousel uses `priority` only for first 1–2.
- **Interaction:** plan hover→highlight (exists) refined; inquiry prefilled per plan (exists) kept; Save micro-interaction.
- **Hierarchy/Type:** H1 name from token; section `h2`s consistent; price/rating emphasized once.
- **Color:** accent on Contact + recommended plan; green for WhatsApp/open.
- **Components:** GymCarousel(polish), Actions, Plans★, Reviews/Scores, Inquiry★, Gallery, Accordion.
- **Before→After:** competent flat profile → premium, anchored, conversion-focused page.

## `/search` (discover) — Priority P4

**Current problems:** **no mobile filtering** (sidebar `hidden lg:block`); no result skeleton; top bar styling differs from hero/header; CRLF endings.

- **Visual:** unify search bar language; refine chips/toggles; consistent card rails.
- **UX:** **mobile filter sheet** (bottom-sheet, same filter state, "Apply"/"Clear"); result-count + active-filter chips; keep grid/map toggle.
- **A11y:** chips `aria-pressed`; filter sheet trap focus; results count `aria-live`.
- **Animation:** results stagger reveal; sheet slide-in; map view crossfade.
- **Perf:** server page already streams data; add skeleton during client filter compute for large sets; debounce reverse-geocode.
- **Interaction:** preserve all filter/sort/geolocation/area-grouping logic exactly; add clear-all.
- **Hierarchy/Spacing:** result header prominent; sidebar quieter.
- **Components:** SearchExperience★, GymRow, GymCard, GymMap, new FilterSheet (UI-only).
- **Before→After:** desktop-only filtering, plain list → fully mobile-capable, polished, animated discovery.

## `/compare` — Priority P4

**Current problems:** wide table, no scroll affordance, no skeleton (N+1 upstream); duplicate ratings rows to verify.

- **Visual/UX:** sticky header row + sticky first column with solid bg; horizontal scroll hint/shadow; refined best-price/best-rating highlight (subtle pill + motion); skeleton while loading.
- **A11y:** table semantics or ARIA grid; remove buttons labelled; keyboard scroll.
- **Animation:** column add/remove transition; highlight pulse on change.
- **Perf:** (optional, behind same API) reduce N+1 by reusing list data where detail not needed — only if zero contract change; otherwise add skeleton.
- **Components:** CompareTool★, GymImage.
- **Before→After:** functional but cramped table → legible, sticky, premium comparison.

## `/partner-with-us` — Priority P5

- **Problems:** strong content; bespoke dark inputs in DemoForm; sections could breathe.
- **Improvements:** typographic polish to token scale; reveals; align DemoForm fields to system (keep POST logic); pricing tiers as crafted cards; consistent radii. **Before→After:** good marketing page → premium owner pitch.

## `/about` — Priority P5
- Token-scale headings, section reveals, consistent stat/value cards, team avatars on gradient tokens. Static; keep content.

## `/owner/login` — Priority P5
- **Problems:** off-brand (`bg-gray-50`, `blue-600`, `Shield`). **Improvements:** rebrand to Gymma tokens (ink/orange, gymma mark), keep Google OAuth + redirect logic verbatim; calm centered card; clear error state via tokens.

## `/owner/onboarding` — Priority P5
- **Problems:** functional multi-step; raw inputs; stepper plain. **Improvements:** branded stepper with progress (`--gradient-accent`), `ui/Input`/`Button`, animated step transitions; **preserve all form state, validation, photo-upload simulation, and submit logic exactly.**

## `/owner/dashboard` — Priority P5
- **Problems:** mixed dialect; stat cards plain; tabs ok. **Improvements:** rebrand stat cards (consistent surfaces, delta chips), tab underline animation, MembersTab table to token styling; keep auth guard + `listOwnerGyms` + tab/member logic.

## `/privacy`, `/terms` — Priority P5
- Prose typography pass (max-w-3xl, token headings, comfortable leading); add a quiet page-hero band; no content change.

## Cross-cutting (applies to every route)
- **Header:** keep behavior; refine scrolled glass, active-link indicator (animated underline), unify the search overlay with hero typeahead.
- **Footer:** keep; minor type/spacing alignment.
- **404 / not-found:** already on-brand; align button to system.
- **Route transitions:** global `PageTransition` wrapper (subtle, reduced-motion aware).
- **Skeletons & empty/error states:** standardized everywhere data loads.
