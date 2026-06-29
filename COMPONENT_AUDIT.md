# COMPONENT_AUDIT.md

> Audit only — no implementation. Each entry: purpose · current state · problems (visual/UX/a11y/perf) · recommended redesign · priority (P1 highest) · complexity (S/M/L). Plus consolidation notes at the end.

---

## UI primitives

### `ui/Button`
- **Purpose:** all buttons/CTAs. Variants primary/accent/secondary/ghost/danger; sizes sm/md/lg; loading.
- **Current:** clean, token-driven, forwardRef, `active:scale-[0.99]`, focus ring.
- **Problems:** transition only `colors` (transform/shadow not eased); no icon-only square size; accent under-used as the conversion CTA.
- **Recommend:** broaden transition to color+transform+shadow with `--dur-2/--ease-out`; add `iconOnly` sizing; document accent = primary conversion CTA. Keep API 100%.
- **Priority P1 · Complexity S.**

### `ui/Input`
- **Purpose:** text input with left/right icon + error.
- **Current:** solid; `aria-invalid`, `role="alert"` error.
- **Problems:** other forms (contact, demo, onboarding, members) **don't use it** → inconsistent focus/error. Radius `sm` vs system `md`.
- **Recommend:** bump to `md`; adopt across forms (or extract shared field class). **P2 · S.**

### `ui/Card`
- **Purpose:** generic surface.
- **Problems:** barely used; real cards hand-roll borders/radii → inconsistency.
- **Recommend:** make it the canonical resting/hover surface (DESIGN_SYSTEM card spec) and adopt where sensible. **P2 · S.**

### `ui/Badge`
- **Current:** good tinted variants.
- **Problems:** warning/error use hardcoded hex instead of tokens.
- **Recommend:** route to semantic tokens; otherwise keep. **P2 · S.**

### `ui/StarRating`
- **Current:** half-star support, interactive mode, `radiogroup`/`img` roles.
- **Problems:** interactive stars not keyboard-operable as a radio group (buttons but no arrow-key semantics); fine for display.
- **Recommend:** keep display path; if interactive used, add radio semantics. **P3 · S.**

### `ui/Skeleton`
- **Current:** pulse block.
- **Problems:** no composed skeletons exist, so pages fall back to spinner/text.
- **Recommend:** build `GymCardSkeleton`, list & detail skeletons on top of it. **P1 · S** (primitive) / **M** (compositions).

### `ui/Modal`
- **Current:** portal, Esc close, scroll lock, bottom-sheet→center responsive, `aria-modal`.
- **Problems:** **no focus trap, no focus restore**; close button only — no initial focus; animation is CSS `animate-fade-up` only.
- **Recommend:** focus trap + restore, initial focus, framer enter/exit, reduced-motion aware. **P3 · M.**

### `ui/Accordion`
- **Current:** single-open, `aria-expanded`, chevron rotate.
- **Problems:** content mount/unmount is instant (no height animation); first item force-open.
- **Recommend:** animate expand/collapse (grid-rows or framer height), keep semantics. **P3 · S.**

### `ui/Lightbox`
- **Current:** portal, arrow/Esc keys, scroll lock.
- **Problems:** no focus trap/restore; relies on `GymImage`; no swipe on mobile; no `aria-current`.
- **Recommend:** focus trap, swipe, counter as `aria-live`. **P3 · M.**

## Gym components

### `gym/GymCard`  ★ signature unit
- **Purpose:** the product's core repeating unit (explore grids, search rows).
- **Current:** image + open/closed pill + premium tag + title/rating/area/price/amenities + CTA row; full-card link overlay; computes open-now locally.
- **Problems:** hierarchy flat (title vs price compete); amenity pills visually noisy; hover is translate+shadow only; image lacks vignette so white pill can clash on light gradients; CTA row duplicates the card-link affordance.
- **Recommend:** stronger type hierarchy, refined image overlay/vignette, crafted hover (image zoom + lift + subtle border), tidy amenity row, keep link overlay + z-10 CTAs and the open-now logic untouched. **P1 (after foundation) · M.**

### `gym/GymCardCompact`
- **Purpose:** horizontal rail card.
- **Recommend:** align to GymCard's new visual language; keep footprint. **P3 · S.**

### `gym/GymImage`
- **Purpose:** image with `next/image` swap + gradient placeholder.
- **Problems:** broad `sizes`; placeholder lacks vignette.
- **Recommend:** add optional overlay/vignette prop; tighten `sizes` per usage; keep gradient seed logic + swap point. **P2 · S.**

### `gym/FeaturedRow`
- **Problems:** non-functional "See all" button (no href); overlaps with `search/GymRow`.
- **Recommend:** likely **mergeable** with `GymRow` (see consolidation). **P3 · S.**

### `gym/DirectionsButton`
- **Fine.** Keep; align hover to system. **P3 · S.**

## Landing components

### `landing/Hero` ★
- **Purpose:** explore entry; location + dual search + typeahead + quick tags.
- **Problems:** text-only on white (not cinematic); brittle inline `min-width:180px`; duplicates header search logic/imports MOCK_GYMS into client; dropdown not a combobox.
- **Recommend:** cinematic treatment (depth, imagery/gradient, motion reveal), responsive search w/o magic numbers, share one typeahead source; preserve geolocation + routing behavior exactly. **P2 · L.**

### `landing/StatsBar` — fine; add count-up on scroll (reduced-motion aware). **P3 · S.**
### `landing/SectionHeader` — good; add reveal + optional size variants for rhythm. **P2 · S.**
### `landing/GymGrid` — thin wrapper; add staggered reveal. **P2 · S.**
### `landing/MapPreview` — imports MOCK_GYMS client-side; keep map, lazy/defer below fold. **P3 · S.**
### `landing/WhyChooseUs` — solid; tighten card consistency + reveal; one card has duplicated copy (data + JSX). **P3 · S.**
### `landing/OwnerCTA` — strong dark block; keep, refine type scale. **P3 · S.**
### `landing/ContactSection` — bespoke inputs (not `ui/Input`); align + success state exists. **P3 · M.**
### `landing/Discovery` — **appears unused** by routes (search uses `SearchExperience`). Verify; if dead, **remove**. **P2 · S.**

## Gym-detail components

### `gym-detail/GymCarousel`
- **Current:** sophisticated imperative slide/fade + fullscreen, framer for crossfade/modal.
- **Problems:** complex; autoplay no pause-on-focus; fullscreen modal not focus-trapped.
- **Recommend:** **polish in place** (a11y: pause on hover/focus already partial, add focus trap to fullscreen) — do **not** rewrite. **P3 · M (careful).**

### `gym-detail/Actions` (HeroActions, BottomBar) — fine; align buttons (accent for Contact); safe-area on BottomBar. **P3 · S.**
### `gym-detail/AboutSection` — read-more clamp; animate expand. **P3 · S.**
### `gym-detail/GallerySection` — horizontal strip → Lightbox; add reveal, ensure a11y labels (have them). **P3 · S.**
### `gym-detail/TrainersRow` — initials avatars; align card style, gradient avatar token. **P3 · S.**
### `gym-detail/PlansSection` ★ conversion — hover-highlight + recommended badge. **Recommend:** make the conversion moment (clear emphasis, accent CTA, motion on highlight). **P3 · M.**
### `gym-detail/FacilitiesGrid` — icon grid; fine, align radius/hover. **P3 · S.**
### `gym-detail/ClassesList` — list rows; fine. **P3 · S.**
### `gym-detail/ReviewsSection` + `ScoresCard` — distribution bars + category scores + sort. Solid; animate bars on reveal, add empty state. **P3 · M.**
### `gym-detail/Inquiry` ★ primary conversion — modal form, validation, WhatsApp fallback, success. **Recommend:** inherits Modal a11y upgrade; polish fields via `ui/Input`; keep validation/logic exactly. **P3 · M.**

## Search / compare / map / owner

### `search/SearchExperience` ★
- **Problems:** filter sidebar `hidden lg:block` → **no mobile filtering**; CRLF line endings; results grouped into area rails (good) but no loading skeleton; reverse-geocode on mount.
- **Recommend:** add **mobile filter sheet** (UI-only, same state), result skeletons, unify top search bar with header/hero language; preserve all filter/sort/geo logic. **P4 · L.**

### `search/GymRow` — scroll rails with edge buttons; good. Candidate merge target for FeaturedRow. **P4 · S.**

### `compare/CompareTool` ★
- **Problems:** wide table; sticky label col but header lacks scroll hint; "Google map ratings" and "Gymma ratings" rows are duplicated (same value) — verify intent; no skeleton (N+1 upstream).
- **Recommend:** legibility pass (sticky header + first col, scroll affordance, highlight craft for best price/rating), skeleton. Keep selection logic + MAX=4. **P4 · M.**

### `map/GymMap` + `map/LeafletMap` — correctly dynamic `ssr:false`; custom price pins. Keep; restyle pins/popups to tokens, keep scroll-zoom gating. **P4 · S.**

### `owner/DemoForm` — dark glass form; bespoke inputs; real POST to `/demo-requests`. Align inputs, keep submit logic. **P5 · S.**
### `owner/AnnouncementComposer` — local-state composer; keep, align. **P5 · S.**
### `owner/MembersTab` — table + add form; **off-brand** raw inputs/`border-neutral-300`; real API calls. Rebrand UI, keep API. **P5 · M.**

## Page-level (containers, audited for layout/state only)
- `app/(consumer)/owner/login|onboarding|dashboard` — off-brand (`bg-gray-50`, `blue-600`). Rebrand to tokens; preserve auth/route-guard/onboarding logic. **P5 · M.**
- `about / partner-with-us / privacy / terms` — static; typographic polish + reveals. **P5 · S–M.**

## Consolidation summary
- **Merge candidates:** `gym/FeaturedRow` → fold into `search/GymRow` (one horizontal-rail component). Verify both call sites first.
- **Remove candidates:** `landing/Discovery` (no route references it — confirm, then delete). Dead imports of `MOCK_GYMS` on client (hero/header/map-preview) — reduce to a single shared, slimmer typeahead source.
- **Promote to primitives:** composed skeletons (`GymCardSkeleton`, etc.); a `Reveal` motion wrapper; a `PageTransition` wrapper (new `ui`/`motion` primitives in P1).
- **Split:** none required — components are already appropriately sized.
- **Become generic UI:** the area-rail (`GymRow`) and the section-reveal pattern.
