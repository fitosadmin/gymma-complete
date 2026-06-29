# MOTION_GUIDELINES.md

> Motion is a first-class part of Gymma's language. Built on `framer-motion@11` (installed) + CSS transitions. Every animation must justify itself; the default for any element is *no motion*.

---

## Animation philosophy

Motion exists to **communicate**, never to decorate. It should make the product feel responsive, guide attention, and add a sense of craft and energy (athletic, confident — not bouncy or playful). When in doubt, less. Cinematic restraint over spectacle (the Lando Norris/Apple lesson): a few well-timed, buttery moments beat constant movement.

## Motion hierarchy

1. **Feedback (highest priority):** press, hover, focus, toggle, loading — instant, ≤150ms. Always present.
2. **Transitions:** entrances on scroll, route changes, modal/sheet open — 250–600ms.
3. **Ambient/cinematic (lowest, rarest):** hero reveal, image reveal, count-up — 600–800ms, above the fold only.

## Animation principles

- Animate **`transform` and `opacity` only** for anything that runs on scroll/interaction (GPU, no layout). Height/width/`top` animations only for small, contained, infrequent cases (accordion) and via `grid-template-rows` or framer layout.
- Entrances move **a short distance** (12–24px) and fade in together.
- One easing family: `--ease-out` for entrances, `--ease-in-out` for reversible, `--ease-spring` rare.
- Stagger siblings 40–80ms; cap total stagger so a grid never feels slow.
- Everything reversible (modal/sheet/dropdown) animates out, not just in.

## When animations SHOULD occur

Element entering viewport (once); hover/press on interactive elements; focus; opening/closing overlays; route change; loading→loaded (skeleton→content crossfade); value changes worth noticing (stats count-up, score bars filling, best-price highlight).

## When animations should NOT occur

`prefers-reduced-motion: reduce` (disable all non-essential — already enforced globally in `globals.css`); on every keystroke; on data that updates frequently; re-animating on every re-render or re-scroll; blocking input or content paint; long lists (animate only what's near the viewport).

## Standard durations (tokens)

| Token | ms | Use |
|---|---|---|
| `--dur-1` | 100 | micro color/opacity on tiny controls |
| `--dur-2` | 150 | buttons, inputs, links, toggles |
| `--dur-3` | 250 | cards, dropdowns, chips, tabs |
| `--dur-4` | 400 | modal/sheet, section moves |
| `--dur-5` | 600 | scroll reveals, hero text |
| `--dur-6` | 800 | image reveals, rare cinematic |

## Standard easing curves

`--ease-out: cubic-bezier(.16,1,.3,1)` (entrances; matches the existing `fade-up`) · `--ease-in-out: cubic-bezier(.65,0,.35,1)` (crossfades, reversible) · `--ease-spring: cubic-bezier(.34,1.56,.64,1)` (deliberate micro-delight only). Linear only for spinners/shimmer.

## Per-pattern spec

- **Hover (cards):** `translateY(-2px)` + `shadow-card→card-hover` + inner image `scale(1.05)`, 250–500ms `ease-out`. **Buttons:** bg/color 150ms; `active:scale(.99)`. **Links:** color 150ms.
- **Button:** press scale .99 (instant); loading swaps to spinner, width stable.
- **Card:** reveal on enter (fade+rise 16px, 600ms) with sibling stagger 60ms; hover as above.
- **Page/route transitions:** subtle shared wrapper — content fades+rises 8–12px over 250–400ms on route change (`PageTransition` primitive). No full-screen wipes. Reduced-motion → none.
- **Loading:** skeleton shimmer (1.2s linear loop) matching final layout; on load, crossfade skeleton→content 250ms.
- **Skeleton:** opacity pulse or left-right shimmer; never spinner-only for full pages.
- **Modal:** scrim fade 200ms; panel rise 12px + scale .98→1 over 250–400ms `ease-out`; reverse on close.
- **Sidebar / mobile filter sheet:** slide from edge 300ms `ease-out` + scrim fade; trap focus.
- **Dropdown / typeahead:** fade + 4px rise, 150–200ms; out 100ms.
- **Toast (if used):** slide-up + fade 250ms, auto-dismiss 4s, `role="status"`.
- **Image reveal:** clip/opacity 600–800ms `ease-out` once on enter; cover gets it, grid images optional.
- **Text reveal:** hero headline fade+rise (optionally per-line) 600ms, ≤2 lines staggered; body fades as a block.
- **Scroll-triggered:** IntersectionObserver (or framer `whileInView`, `once:true`, margin so it fires slightly early). Never re-trigger.
- **Parallax:** at most one subtle layer on the hero (≤20px translate tied to scroll), desktop only, reduced-motion off. Optional; cut if it costs smoothness.
- **Micro-interactions:** save/bookmark toggle (spring pop), open-now dot pulse (subtle), score bars fill on reveal, stats count-up.
- **Cursor interactions:** none custom (no custom cursor) — keep native; it suits the editorial restraint and avoids a11y/perf cost.

## Reduced-motion accessibility

The global `@media (prefers-reduced-motion: reduce)` block zeroes animation/transition durations and `scroll-behavior`. **All new motion must degrade to a plain, instant, fully-functional state under it.** Framer: read the preference (`useReducedMotion`) and render final state with no transition. Never gate content visibility solely on an animation completing.

## Performance guidelines

- **GPU:** only `transform`/`opacity` for motion paths; add `will-change: transform` sparingly and remove after.
- **No layout thrashing:** never animate `width/height/top/left/margin` in loops/scroll; batch reads/writes; prefer transforms.
- **Avoid expensive paints:** no animated `box-shadow` on many elements at once (animate a pseudo-element's opacity instead if needed); limit `backdrop-filter` to header + floating controls.
- **Scroll work:** passive listeners; throttle/rAF; prefer IntersectionObserver over scroll math.
- **Budget:** target 60fps; if a reveal grid janks, reduce stagger/translate or drop the effect. Smoothness > flourish.
- Keep framer usage tree-shakeable (`m` + `LazyMotion` where it pays off); don't pull framer into static pages that only need a CSS reveal.

## Inspiration → Gymma translation

Lando Norris/Apple → cinematic, restrained hero + buttery scroll reveals. Linear → crisp 150–250ms feedback, no fuss. Stripe → confident section pacing. Nike → energy via image zoom + bold type entrances. **Reinterpreted, never copied.** Gymma's signature: a confident hero reveal, signature card hover (lift + image zoom), and score/stat values that animate to convey trust.
