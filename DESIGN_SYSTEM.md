# DESIGN_SYSTEM.md

> Single source of truth for Gymma's visual language. All tokens live in `src/app/globals.css` `:root` and are surfaced through `tailwind.config.ts`. **Re-theme by editing `:root`, never components.** Anything not defined here must not be invented in a component.

---

## Brand philosophy

Gymma is **editorial, photo-first, and confident** — the calm authority of Apple/Linear, the energy of Nike, the trustworthy clarity of Airbnb/Stripe, with the cinematic restraint of the Lando Norris site. Near-black does the heavy lifting; a single orange is earned, not sprayed. The product should feel like a premium guide, not a dashboard. Principles: **clarity over decoration, motion with meaning, one deliberate accent, generous space, relentless consistency.**

## Color palette (existing tokens — keep)

**Primary / orange (energy, the one accent):** `--color-primary-50…700` (`#fff7ed → #c2410c`), base `500 #f97316`.
**Secondary / green (health, positive):** `--color-secondary-50/100/500/600/700`, base `500 #22c55e`.
**Neutral (carries the design):** `--color-neutral-0 #fff … 900 #171717` (full 0–900 ramp).
**Ink (primary action):** `--color-ink #0a0a0a`, `--color-ink-hover #404040`.
**Semantic:** `--color-success`(=green500), `--color-warning #eab308`, `--color-error #ef4444`, `--color-info #3b82f6`.
**Rating:** `--color-rating-star #fbbf24`.

### New tokens to ADD (P1) — additive only

```
/* Surfaces — name the greys we already use so cards/sections stop hardcoding */
--surface-base:    var(--color-neutral-0);   /* page */
--surface-subtle:  var(--color-neutral-50);  /* alt sections, stats bar */
--surface-raised:  var(--color-neutral-0);   /* cards */
--surface-inverse: var(--color-ink);         /* owner-CTA, dark blocks */

/* Borders */
--border-subtle:  var(--color-neutral-200);
--border-strong:  var(--color-neutral-300);

/* Accent gradient (hero word, progress, premium) */
--gradient-accent: linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%);
--gradient-ink:    linear-gradient(180deg, #171717 0%, #0a0a0a 100%);

/* Glass (used sparingly: sticky header, floating controls) */
--glass-bg:     rgb(255 255 255 / 0.72);
--glass-border: rgb(255 255 255 / 0.5);
--glass-blur:   12px;

/* Focus ring (single definition) */
--ring: var(--color-primary-500);
```

**Dark mode:** out of scope for this redesign (app is light-only and the spec freezes behavior). Token structure above makes a future `[data-theme="dark"]` override trivial — do not ship it now.

## Typography scale (existing — enforce, don't expand)

Inter Variable. Token sizes in `tailwind.config.ts` are authoritative; **pages must use these, not raw `text-5xl`**:

| Token | Size / line / tracking / weight | Use |
|---|---|---|
| `display` | 3rem / 1.1 / -.02em / 700 | hero H1, page heroes |
| `h1` | 2.25rem / 1.2 / -.02em / 700 | page titles |
| `h2` | 1.875rem / 1.25 / -.01em / 600 | section titles |
| `h3` | 1.5rem / 1.3 / -.01em / 600 | sub-section / card group |
| `h4` | 1.25rem / 1.4 / 600 | card title, plan name |
| `body` | 1rem / 1.6 | prose |
| `body-sm` | .875rem / 1.5 | meta, secondary |
| `caption` | .75rem / 1.4 / .01em / 500 | labels, eyebrows |
| `button` | .875rem / 1 / .01em / 600 | button/CTA text |

**Rule:** hero may scale up responsively (`text-display sm:text-[3.5rem] lg:text-[4.25rem]`) but must start from the token. Eyebrows = `caption` + uppercase + `tracking-widest` + `neutral-500`.

## Spacing system

Use the `--space-1…24` ramp (4 → 96px) via Tailwind's default scale (they align). Section vertical rhythm: mobile `py-16`, desktop `py-20/24`. Container: `max-w-7xl px-6` (content), `max-w-3xl/4xl` (prose/hero copy), `max-w-[860px]` (gym-detail article). Card padding `p-4` (compact) / `p-5` (standard) / `p-6` (feature).

## Grid system

12-col mental model via Tailwind grids. Card grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5`. Detail: single 860px column. Search: `aside w-60` + fluid results. Compare: CSS grid `minmax(140px,180px) repeat(n, minmax(180px,1fr))`.

## Border radius (existing)

`sm 6px · md 10px · lg 16px · xl 24px · full`. **Standardize:** inputs/buttons `md`; cards `lg`; feature panels / modals / images `xl`; pills/badges `full`. Retire ad-hoc `rounded-2xl` on cards → `rounded-lg` or `xl` per role.

## Elevation / shadow system (existing)

`sm · md · lg · xl · card · card-hover`. Roles: resting card `shadow-card`; hover `shadow-card-hover` + `-translate-y-0.5`; modal/lightbox `shadow-xl`; floating controls `shadow-lg`. Avoid stacking shadow + heavy ring; pick one.

## Glassmorphism rules

Only for **sticky header (scrolled)** and **floating segmented controls**. `background: var(--glass-bg); backdrop-filter: blur(var(--glass-blur)); border: 1px solid var(--glass-border)`. Never on content cards (kills legibility, costs paint).

## Gradient system

`--gradient-accent` for the hero accent word, progress fills, premium markers, trainer avatar. `--gradient-ink` for dark CTA blocks / owner surfaces. `GymImage` placeholder gradients stay as-is. No rainbow/multi-hue gradients.

## Iconography

`lucide-react` only, `1.5` stroke, sizes 14/16/18/20 (`h-4/5`). Icon-only buttons require `aria-label`. Don't mix icon families.

## Illustration / photography direction

Photo-first. Real gym imagery (Cloudinary/Places) when present; branded gradient placeholder otherwise (`GymImage`). Always `object-cover`, consistent aspect (`16/9` cards, `16/7` detail cover, `4/3` compact). Apply a subtle top-down vignette on hero/cover images so white overlays stay legible. No stock-cheese, no clip-art.

## Card design

Resting: `bg-surface-raised rounded-lg border border-border-subtle shadow-card`. Hover (interactive): `-translate-y-0.5`, `shadow-card-hover`, image `scale-105` (500ms), border darkens. Title→meta→amenities→price→CTA hierarchy. Keep the full-card link overlay (`after:inset-0`) with explicit CTA buttons layered `relative z-10`.

## Button system (extend `ui/Button`, keep API)

Variants: `primary` (ink), `accent` (orange), `secondary` (outline), `ghost`, `danger`. Sizes `sm/md/lg` (h-9/11/12). Add: consistent `active:scale-[0.99]`, `transition` covering color+transform+shadow, optional `icon-only` square sizing, loading spinner (exists). Primary CTA on conversion surfaces = `accent`; structural actions = `primary`.

## Input / form system

`h-11 rounded-md border border-border-subtle bg-white text-body`, focus `border-primary-500` + ring via `:focus-visible`, error `border-error` + `role="alert"` message. **Unify** the bespoke inputs in contact-section, demo-form, members-tab, onboarding onto `ui/Input` (or a shared class) so focus/disabled/error are consistent. Textareas inherit the same border/focus.

## Table styling (compare, members)

Header row `bg-surface-subtle text-caption uppercase text-neutral-500`; body rows `divide-y border-subtle`, row hover `bg-neutral-50`; sticky first column on compare with solid bg. Numeric cells right-aligned where comparative.

## Modal styling

Center on desktop, bottom-sheet on mobile (current). `rounded-xl shadow-xl`, scrim `bg-black/50`. **Add (P3): focus trap, focus restore on close, labelled by title.** Enter: scrim fade + panel rise/scale; respect reduced-motion.

## Badge / chip styling

Badge = `rounded-full px-2.5 py-1 text-caption font-medium`, variants tinted (primary/secondary/success/warning/error/neutral). Chip (filter) = `rounded-full border px-3.5 py-1.5 text-sm`, selected = ink fill, needs `aria-pressed`. Status dots (open/closed) keep green/neutral.

## Toast styling

Not currently present. If introduced for inquiry/announcement success, define: bottom-center, `rounded-md shadow-lg`, max-w-sm, auto-dismiss 4s, `role="status"`, slide-up+fade. **Do not add unless a flow needs it** (avoid scope creep).

## Animation tokens (ADD to `:root`, P1)

```
--ease-out:   cubic-bezier(0.16, 1, 0.3, 1);   /* standard entrances (matches existing fade-up) */
--ease-in-out:cubic-bezier(0.65, 0, 0.35, 1);  /* moves/crossfades */
--ease-spring:cubic-bezier(0.34, 1.56, 0.64, 1);/* playful pop, used sparingly */
--dur-1: 100ms; --dur-2: 150ms; --dur-3: 250ms;
--dur-4: 400ms; --dur-5: 600ms; --dur-6: 800ms;
```

## Transition durations

100ms micro (color/opacity on tiny controls) · 150ms buttons/inputs · 250ms cards/dropdowns/toggles · 400ms modals/section moves · 600ms hero/scroll reveals · 800ms image reveals & rare cinematic moments. (Full guidance in MOTION_GUIDELINES.md.)

## Easing curves

Default `--ease-out` for entrances; `--ease-in-out` for reversible motion; `--ease-spring` only on deliberate micro-delights (e.g. save-toggle). Linear only for indeterminate spinners/shimmer.

## Hover / focus / loading / skeleton / error / empty / success states

- **Hover:** transform + shadow (cards), bg/color (buttons/links), image zoom (cards/cover). Never layout-shifting.
- **Focus:** global `:focus-visible` 2px `--ring`, offset 2 — already shipped; keep on every interactive element.
- **Loading:** `ui/Skeleton` shimmer/pulse matching final layout; buttons show inline spinner + disabled.
- **Skeleton:** dedicated card/list/detail skeletons mirroring real geometry (no spinner-only screens). Replaces explore's `"Loading gyms..."`.
- **Error:** inline, calm, actionable ("Couldn't load gyms. Retry."), `role="alert"`. Never blank.
- **Empty:** icon + one-line cause + one action (search empty state is the template; extend to compare/reviews).
- **Success:** inquiry/contact/demo confirmation panels (exist) — keep, align styling.

## Responsive breakpoints (Tailwind defaults)

`sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`. Mobile-first. Key shifts: nav collapses `<md`; card grid 1→2→3 at sm/lg; search sidebar appears `lg`; detail actions desktop-inline vs mobile sticky bar. Respect iOS safe-area on fixed bars (`pb-[env(safe-area-inset-bottom)]`).

## Accessibility rules (mandatory)

Semantic landmarks (`header/nav/main/footer/section` — present); one `h1` per page from the token scale; visible focus everywhere; `prefers-reduced-motion` disables non-essential motion (shipped — keep honoring it); modal/lightbox focus trap + restore (P3); icon-only controls labelled; state not by color alone (`aria-pressed/-current/-expanded`); contrast ≥ 4.5:1 body / 3:1 large — verify orange-on-white text (`primary-600`+ only for text). Maintain keyboard order through the card-link overlay pattern.
