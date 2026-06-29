# PERFORMANCE_CHECKLIST.md

> Production-readiness audit. Each item: **Problem · Impact · Solution · Expected improvement.** Nothing here changes the API contract, routes, or business logic.

---

## Build verification (environment note)
- **Problem:** No backend on `:3001` in this sandbox → SSG/server fetches throw `ECONNREFUSED`, build can't collect page data.
- **Impact:** Can't run the mandated build gate.
- **Solution:** Run a disposable local mock API on `:3001` serving `gyms.generated.ts` shapes (`/gyms`, `/gyms/:slug`, `/gyms/:id/reviews`) **for verification only** — zero changes to `lib/api.ts`. Set `NEXT_PUBLIC_API_URL` accordingly when building locally.
- **Expected:** `npm run build` + `tsc --noEmit` pass each phase; real deploys point at the real API unchanged.

## Rendering & data
1. **`/explore` is a client component fetching in `useEffect`.** Impact: no SSR/stream, blocks on a loading string, hurts LCP/CLS. Solution: convert to server component with `<Suspense>` streaming featured rails + skeletons (data contract identical), or keep client + skeletons if server move is risky. Expected: faster first contentful paint, no flash, better LCP.
2. **`/compare` N+1 fetch** (list + per-gym detail). Impact: slow first paint, many round-trips. Solution: parallelize (already `Promise.all`) + skeleton; longer-term only fetch detail for selected gyms — *only if achievable without contract change*. Expected: faster perceived load.
3. **Suspense boundaries** absent. Solution: add around async server segments (explore rails, search results, gym-detail sub-sections). Expected: progressive streaming.
4. **Server Components opportunities:** explore (and any static-data section) can be RSC; keep interactive bits (hero search, map, modals, carousel) as client leaves. Expected: less client JS.
5. **Client Component reduction:** stop importing `MOCK_GYMS` (~370 KB) into client bundles via header/hero/map-preview; expose a slim typeahead dataset or fetch suggestions. Expected: smaller client bundle, faster TTI.

## Bundle & code splitting
6. **Tree shaking:** import lucide icons individually (already named imports — good); ensure framer-motion uses `m`/`LazyMotion` where heavy. Expected: smaller JS.
7. **Dynamic imports / lazy loading:** Leaflet already `dynamic({ssr:false})` ✅. Also defer `MapPreview` below the fold (load on scroll/intersection); lazy-load Lightbox/fullscreen carousel chrome. Expected: lighter initial route.
8. **Code splitting:** route-level splitting is automatic; ensure modal/lightbox/heavy owner forms aren't pulled into shared chunks.

## Images
9. **Google Places `photoreference` URLs are huge & unoptimized.** Impact: large LCP image, bandwidth. Solution: keep `next/image` (`fill`, `object-cover`), tighten `sizes` per surface (card vs cover vs compact), set `priority` only on the first above-fold image, add `placeholder="blur"`/vignette where cheap. Expected: better LCP, less data.
10. **Aspect ratios fixed** (good — prevents CLS). Keep enforcing `aspect-video`/`16/7`/`4/3`.

## Fonts
11. **Inter via fontsource loads the full variable file.** Impact: minor FOUT/size. Solution: acceptable; if needed, move to `next/font` with `display: swap` + subset (keeps `--font-inter`). Expected: marginal LCP/CLS win.

## Rendering optimization
12. **Memoization:** `useMemo` already used in filters/sort/typeahead. Add `React.memo` to `GymCard`/`GymRow` if profiling shows re-renders on filter changes. Expected: smoother large-list interactions.
13. **Re-render hygiene:** stable handler identities in `SearchExperience`/`CompareTool`; avoid recreating arrays each render. Expected: fewer renders.

## Animation performance
14. **Transform/opacity only** for scroll/interaction motion; `will-change` sparingly; IntersectionObserver/`whileInView once`. Expected: 60fps reveals, no jank.
15. **Limit `backdrop-filter`** to header + floating controls; don't animate `box-shadow` across many nodes. Expected: cheaper paints.

## Accessibility performance / quality
16. Focus traps on Modal/Lightbox (also a11y); reduced-motion honored (shipped). `aria-pressed/current/expanded` on stateful controls. Expected: better a11y score, no perf cost.

## SEO
17. Gym-detail has metadata + JSON-LD ✅. Add per-route `metadata` where missing (explore is client → add `export const metadata` via a server wrapper or move metadata up). Ensure semantic headings/landmarks. Expected: better crawlability.

## Core Web Vitals (targets)
- **LCP:** hero text/image — server-render + `priority` image → target < 2.5s.
- **CLS:** fixed aspect ratios + skeletons matching layout → target < 0.1.
- **INP:** debounce typeahead/geocode, memoize filters → target < 200ms.

## Lighthouse
18. Run before/after each phase (perf/a11y/best-practices/SEO). Gate: **no category regresses vs the P0 baseline.** Record numbers in phase notes.

## Prefetching & caching
19. `next/link` prefetch on viewport (default) ✅; verify key CTAs use `Link`. API calls already use `next: { revalidate: 60 }` ✅ — keep. Expected: snappy nav, cached lists.

## Error boundaries & loading & streaming & hydration
20. **Error boundaries:** add route `error.tsx` where data can fail (search, compare, gym) for graceful recovery. Expected: no white screens.
21. **Loading:** `loading.tsx` exists for owner dashboard; add for search/compare/gym with real skeletons. Expected: instant feedback.
22. **Streaming:** via Suspense (above). **Hydration:** reduce client components → less hydration cost; ensure no SSR/client markup mismatch in time-based bits (`checkIsOpenNow`, `timeAgo`) — compute client-side or accept hydration-safe defaults. Expected: faster, mismatch-free hydration.

## Long-term maintainability
- Keep tokens as the only theming surface (`:root`); never hardcode colors/sizes in components.
- One card component, one rail component, one set of skeletons, one motion-primitive set — consolidate per COMPONENT_AUDIT.
- Re-enable `eslint`/`typescript` build checks once the codebase is clean (currently both `ignore*` in `next.config.mjs`); add CI to run `tsc --noEmit` + `next build` against the mock API.
- Remove dead code (`landing/Discovery` if unused) and duplicate logic (typeahead) to keep the bundle lean.
