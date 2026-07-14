# Gymma — Web Deployment Readiness Audit

**Date:** 2026-07-14
**Scope:** `frontend/gymma`, `frontend/gymma-web`, `gymma-admin`, `backend/gymma-api`, `gymma-reviews-api`, `broadcast-api`.
**Out of scope:** `gymma_flutter_api`, `fitos/`, `diet_suggestion/` (referenced only where a web app touches them).
**Method:** read the source. README/blueprint/`.md` claims were ignored unless verified in code. Builds/typechecks were actually run.

> Note: `gymma-reviews-api` is **deleted from the working tree** (see `git status`) — every file shows as `D`. It was read from git `HEAD`. If the intent is to deploy it, it must first be restored. As it stands it is not on disk.

---

## 1. Executive summary — can this ship?

- **No. Not without P0 work.** Live **production database credentials are committed in plaintext** (Neon Postgres + Render Redis) across 12 tracked files. That's a credentials-rotation-before-anything-else event.
- **The builder (`frontend/gymma-web`) has no backend at all.** It contains zero HTTP calls — no `fetch`, no `axios`, no API client. "Publish" writes the gym to `localStorage` ([publishStore.ts:24](frontend/gymma-web/src/gym/publishStore.ts)). A published gym exists only in the browser that made it. The core product loop (owner builds a site → public visits it) does not work across devices. This needs new tables + endpoints, not tweaks.
- **`frontend/gymma` build fails.** `next build` errors out collecting `/gym/[slug]` because gym pages are SSG'd from the API at build time and the API isn't up ([gymma-build.log], `ECONNREFUSED`). On Render free tier the API cold-starts, so **the frontend build breaks whenever the API is asleep**.
- **CORS on all three APIs reflects any origin with `credentials:true`** — a spec-violating, cookie-exfiltration-enabling config. Auth tokens are stored in `localStorage` on both web apps (full XSS blast radius). Access-token TTL is **30 days** with no working refresh path.
- **The homepage still renders hardcoded mock data.** Hero search, header search, and map preview read `MOCK_GYMS` from `gyms.generated.ts`, not the API — so search suggestions link to gyms that may not exist in the DB. Sub-scores shown to users (cleanliness/equipment/value/crowd) are **fabricated** (`avg ± a constant`) in the materialized view.

**Verdict: 2–3 days of P0 work minimum before a safe deploy, and that's only if you accept the builder shipping as a client-only demo. Making the builder actually persist is a multi-day backend project.**

---

## 2. Part 1 — Backend fitness check

### 2.0 The headline finding first

**The builder does not talk to any backend.** A tree-wide search for `fetch(`, `axios`, `XMLHttpRequest`, `API_URL`, and `import.meta.env` across `frontend/gymma-web/src` returns **nothing**. So before mapping individual fields: *every* builder field is unsupported over the network today, because there is no network call. The table below maps builder fields against what the **`gymma-api` owner module** *could* accept if the builder were wired to it — to show how big the gap is even then.

### 2.1 Builder field → backend mapping

Builder shape: [types.ts](frontend/gymma-web/src/builder/types.ts) (`GymDraft`). Backend targets: [001_initial_schema.sql](backend/gymma-api/migrations/001_initial_schema.sql), owner endpoints in [owner.schema.ts](backend/gymma-api/src/modules/owner/owner.schema.ts) / [owner.repository.ts](backend/gymma-api/src/modules/owner/owner.repository.ts). Owner write endpoints are only `PUT /owner/gyms/:gymId` (`updateGymBody`) and `PUT /owner/gyms/:gymId/onboard` (`onboardGymBody`).

| Builder field | Backend column / endpoint | Verdict |
|---|---|---|
| `basics.name` | `gyms.name` — but **no owner endpoint updates name** (only admin `createGym`) | NOT SUPPORTED (owner) |
| `basics.tagline` | no column, no endpoint | NOT SUPPORTED |
| `basics.description` | `gyms.description` via `updateGymBody`/`onboardGymBody` | supported |
| `basics.foundedYear` | `gyms.years_operating` exists, **no endpoint sets it** | NOT SUPPORTED |
| `basics.ownerName` | no column | NOT SUPPORTED |
| `basics.category` | no column | NOT SUPPORTED |
| `basics.logo` | no column | NOT SUPPORTED |
| `basics.cover` | `gyms.cover_image_url` exists, **no owner endpoint sets it** | NOT SUPPORTED |
| `location.address` | `gyms.address_line` via `updateGymBody` (as `addressLine`) | partially (name mismatch) |
| `location.landmark` | no column | NOT SUPPORTED |
| `location.city` | `gyms.city` — no owner endpoint | NOT SUPPORTED |
| `location.state` | no column | NOT SUPPORTED |
| `location.pincode` | no column | NOT SUPPORTED |
| `location.mapsUrl` | no column (only `lat`/`lng`, which builder never collects) | NOT SUPPORTED |
| `location.parking` | `gyms.has_parking` exists, **no owner endpoint** | NOT SUPPORTED |
| `location.hours[7]` (per-day) | `gyms.opens_at`/`closes_at` — **single pair only**, no per-day model | NOT SUPPORTED (data loss) |
| `gallery[]` (base64 `dataUrl`) | `onboardGymBody.photos[].url` expects a **URL**, and `gym_gallery.url`; builder holds base64 with no upload step | NOT SUPPORTED |
| `facilities[]` | `gym_amenities` via `onboardGymBody.amenities`, but constrained to the `amenity_type` **enum**; builder facilities are free strings | partially (enum mismatch → insert fails) |
| `equipment[]` | **no table, no endpoint anywhere** | NOT SUPPORTED |
| `plans[].name/durationMonths/price` | `membership_plans` via `onboardGymBody.membershipPlans` | partially |
| `plans[].joiningFee/benefits/popular/offer` | `benefits` column exists but endpoint drops it; no `joining_fee`/`popular`/`offer` | NOT SUPPORTED |
| `classes[]` | `gym_classes` table exists but **`onboardGymBody` has no classes field** — endpoint never writes them; schema also mismatches (`days[]`/`capacity` vs `schedule`/`duration_min`) | NOT SUPPORTED |
| `trainers[].name/specialization` | `trainers` via `onboardGymBody.trainers` | partially |
| `trainers[].photo/experienceYears/certifications/bio/instagram` | endpoint accepts only name+specialization; drops the rest | NOT SUPPORTED |
| `social.whatsapp/website/phone` | `gyms.whatsapp`/`website`/`phone`; only `phone`+`whatsapp` in `updateGymBody`, `website` has no owner endpoint | partially |
| `social.instagram/facebook/youtube/email` | no columns | NOT SUPPORTED |
| `seo.slug` | `gyms.slug` — no owner endpoint updates it | NOT SUPPORTED |
| `seo.metaTitle/metaDescription/keywords` | no columns | NOT SUPPORTED |

**Coverage: roughly 5 of ~35 builder fields could round-trip even if the builder were wired up.** The builder was designed against a much richer content model than the API has.

### 2.2 Where does the builder persist? (Q2)

Client-only. [store.tsx:48](frontend/gymma-web/src/builder/store.tsx) autosaves the draft to `localStorage['gymma.builder.draft']`. On publish, [BuilderPage.tsx:127](frontend/gymma-web/src/builder/BuilderPage.tsx) calls `publishGym(finalDraft)` → [publishStore.ts:20](frontend/gymma-web/src/gym/publishStore.ts) which writes to `localStorage['gymma.published']` and returns the slug. **Publish does nothing server-side. There is no POST. Bluntly: publishing is fake** — the "goes live at gymma.com/gym/…" copy in [StepPreviewPublish.tsx:79](frontend/gymma-web/src/builder/steps/StepPreviewPublish.tsx) and the QR code are pointing at a URL only the author's browser can resolve.

### 2.3 Does a published gym render from DB or client store? (Q3)

Client store. [GymRoute.tsx:14](frontend/gymma-web/src/gym/GymRoute.tsx): `getPublishedGym(slug) ?? getDemoGymDraft(slug)` — reads `localStorage` first, falls back to a hardcoded `DEMO_GYMS` array ([demoGyms.ts](frontend/gymma-web/src/home/demoGyms.ts)). `GymPage.tsx` renders that draft object directly. **No fetch, no DB.** A different visitor sees only the demo gyms, never anyone's published gym.

### 2.4 New home page — real API or mock? (Q4)

Mixed, and the mocks leak into production render. `frontend/gymma/src/app/page.tsx` just `redirect("/explore")`. `/explore` ([explore/page.tsx:32](frontend/gymma/src/app/(consumer)/explore/page.tsx)) calls the real `getFeatured()`. But these components render **hardcoded mock imports**:

| File | Mock import | Leaks into render |
|---|---|---|
| [hero.tsx:6](frontend/gymma/src/components/landing/hero.tsx) | `MOCK_GYMS` from `mock-data` | Hero search-suggestion dropdown ([hero.tsx:74](frontend/gymma/src/components/landing/hero.tsx)) — suggestions can link to slugs not in the DB → 404 |
| [map-preview.tsx:6](frontend/gymma/src/components/landing/map-preview.tsx) | `MOCK_GYMS` | The entire homepage map is mock pins ([map-preview.tsx:19](frontend/gymma/src/components/landing/map-preview.tsx)) |
| [header.tsx:9](frontend/gymma/src/components/common/header.tsx) | `MOCK_GYMS` | Global header search on every page ([header.tsx:33](frontend/gymma/src/components/common/header.tsx)) |
| [stats-bar.tsx:4](frontend/gymma/src/components/landing/stats-bar.tsx) | `PLATFORM_STATS` (hardcoded "500+ gyms, 50k members") from `api.ts` | Homepage stats band — fabricated numbers |

`mock-data.ts` re-exports `MOCK_GYMS` and `DETAIL_EXTRAS` from `gyms.generated.ts`. `mock-detail.ts` also imports `DETAIL_EXTRAS`. These are compiled into the client bundle and shipped. Also: the inquiry modal ([inquiry.tsx:74](frontend/gymma/src/components/gym-detail/inquiry.tsx), `setSent(true); // no backend yet`) and the contact form ([contact-section.tsx:18](frontend/gymma/src/components/landing/contact-section.tsx), `setTimeout` fake submit) **do not POST anywhere** — leads are silently dropped, even though `POST /inquiries` exists in the API.

### 2.5 Verdict — is the backend usable as-is? (Q5)

**Needs a new schema + endpoints. Additive changes are not enough** if the builder is meant to persist. Minimum to make the builder real:

1. **`gym_site` (or extend `gyms`)** — columns for the fields the API has no home for: `tagline`, `owner_name`, `category`, `logo_url`, `founded_year`, `landmark`, `state`, `pincode`, `maps_url`, `meta_title`, `meta_description`, `keywords`, social handles (`instagram`, `facebook`, `youtube`, `email`). Realistically store the whole `GymDraft` as a `jsonb` column plus the few indexed/queried scalars.
2. **`gym_hours`** table (7 rows/gym) or a `jsonb hours` column — the current single `opens_at`/`closes_at` can't hold per-day hours.
3. **`gym_equipment`** table — does not exist at all.
4. **Widen `gym_classes`/`trainers`/`membership_plans`** to the builder's fields (capacity, joining fee, popular flag, offer, trainer bio/photo/certs/instagram) — or accept data loss.
5. **`POST/PUT /owner/gyms/:gymId/site`** — one authenticated, ownership-checked, Zod-validated endpoint accepting the full draft; plus a **public `GET /gyms/:slug/site`** for the published render.
6. **Image upload path** — builder holds base64; either accept base64 and push to S3 server-side, or add a presigned-upload endpoint. The existing `POST /owner/gyms/:gymId/gallery` (multer+S3) is close but the builder never calls it and requires an already-onboarded gym.
7. **Point `gymma-web` at the API** — it currently has no HTTP layer whatsoever.
8. **`facilities` mapping** — either change `gym_amenities.amenity` off the enum or map builder free-text to enum values (unmapped values currently throw on insert).

### 2.6 Reviews-API and Broadcast-API reachable from web? (Q6)

**No. Both are dead weight for a web deploy.**

- **`gymma-reviews-api`**: grep of all web frontends for its routes (`gym-score`, `dimension-breakdown`, `leaderboard`, `poll`, `submit`) → **zero hits**. Its public scoring endpoints exist ([gymma.router.ts](gymma-reviews-api/src/modules/gymma/gymma.router.ts)) but no web app calls them. Also it's deleted from the working tree. The homepage instead shows **fake** sub-scores from `gym_rating_summary`.
- **`broadcast-api`**: grep for `broadcast`, its ports (`3002`/WS `3001`), or any onrender URL across the web frontends → the only hits are the word "broadcast" in marketing copy ([partner-with-us/page.tsx:45](frontend/gymma/src/app/(consumer)/partner-with-us/page.tsx)) and an unrelated `:8085` fallback. **No web app opens a socket or calls it.** Its consumers are push/WS clients (the Flutter app), not the websites.

Neither is required to deploy the websites. Deploy them only if the Flutter app needs them; for a web-only launch they are out of scope and add cost/attack surface.

---

## 3. Findings

Severity: **P0** blocks deploy · **P1** fix this week · **P2** later · **P3** cleanup.

| ID | Sev | Area | File:line | Problem | Fix |
|---|---|---|---|---|---|
| S1 | **P0** | Secrets | [check_mig.js:2](check_mig.js), [test_db.js:2](test_db.js), [broadcast-api/check_db.js:2](broadcast-api/check_db.js), `broadcast-api/{db_audit,fix_db}.js`, `diet_suggestion/*` (12 tracked files) | **Live Neon Postgres URL with password `npg_NRmg4Goc1UpH` committed in plaintext.** Full prod DB read/write to anyone with repo access. | Rotate the Neon password NOW. Delete these debug scripts from the repo. Purge from git history (BFG/filter-repo). |
| S2 | **P0** | Secrets | [broadcast-api/check_redis.js:5](broadcast-api/check_redis.js) | Committed Render Redis URL `rediss://red-d90493e7...render.com:6380`. | Rotate Redis creds, delete file, purge history. |
| S3 | **P0** | Build | [gym/[slug]/page.tsx:22](frontend/gymma/src/app/(consumer)/gym/[slug]/page.tsx) | `next build` fails: `generateStaticParams` + page fetch hit the API at build time; `ECONNREFUSED` when API is down/cold (Render free tier sleeps). Build is non-deterministic on API availability. | Make gym pages dynamic (`export const dynamic = 'force-dynamic'`) or ISR with `dynamicParams`, and guard `generateStaticParams` to return `[]` on fetch failure. |
| S4 | **P0** | Builder | [publishStore.ts:24](frontend/gymma-web/src/gym/publishStore.ts), [GymRoute.tsx:14](frontend/gymma-web/src/gym/GymRoute.tsx) | Builder publish is localStorage-only; published gyms are invisible to other users/devices. Core product loop non-functional. QR/share links resolve for nobody. | Build persistence (see §2.5). Until then, do not market "publish" as live. |
| S5 | **P0** | CORS | [app.ts:17](backend/gymma-api/src/app.ts), `gymma-reviews-api/src/app.ts:17`, [broadcast-api/src/app.ts:17](broadcast-api/src/app.ts) | `origin: (_o, cb) => cb(null, true)` **with `credentials:true`** on all three APIs — reflects any origin. Any site can make credentialed cross-origin calls. | Whitelist `FRONTEND_ORIGIN` (already in env, unused). Reflect only allowed origins. |
| S6 | **P1** | Auth storage | [auth.ts:15](frontend/gymma/src/lib/auth.ts), [gymma-admin/lib/auth.ts:11](gymma-admin/lib/auth.ts) | Access **and** refresh tokens in `localStorage`. Any XSS → full account + admin takeover, tokens exfiltratable. | httpOnly, Secure, SameSite cookies; refresh token never reaches JS. |
| S7 | **P1** | Auth lifetime | [env.ts:15](backend/gymma-api/src/config/env.ts) | `ACCESS_TOKEN_TTL` default 2592000s (30 days) = refresh TTL. Stolen JWT valid a month; revocation/rotation pointless. Frontends never call `/auth/refresh`. | Access TTL ~15 min; implement refresh on 401 in both web clients. |
| S8 | **P1** | Data integrity | [002_create_materialized_view.sql:9](backend/gymma-api/migrations/002_create_materialized_view.sql) | Sub-scores are **fabricated**: `score_cleanliness = avg+0.1`, `score_equipment = avg-0.2`, `score_value = avg-0.3`, `score_crowd = avg-0.5`. Shown to users as real category ratings. | Remove fake sub-scores, or source them from `gymma-reviews-api`. Don't display invented data. |
| S9 | **P1** | Env fallback | [api.ts:4](frontend/gymma/src/lib/api.ts) (`localhost:3001`), [demo-form.tsx:6](frontend/gymma/src/components/owner/demo-form.tsx) (`localhost:8085`), [owner/login/page.tsx:10](frontend/gymma/src/app/(consumer)/owner/login/page.tsx) (hardcoded Google client ID), [gymma-admin/lib/api.ts:3](gymma-admin/lib/api.ts) (`https://gymma-api.onrender.com`) | Silent localhost fallbacks + **two different** API URLs (`3001` vs `8085`) + a hardcoded prod Google OAuth client ID + a hardcoded onrender URL. If `NEXT_PUBLIC_API_URL` is unset in prod, the site calls localhost and silently fails. | Fail loudly if `NEXT_PUBLIC_API_URL` is missing. Unify the fallback. Move client ID to env. |
| S10 | **P1** | Dropped leads | [inquiry.tsx:74](frontend/gymma/src/components/gym-detail/inquiry.tsx), [contact-section.tsx:18](frontend/gymma/src/components/landing/contact-section.tsx) | Inquiry modal and contact form fake success with no POST. `POST /inquiries` exists but is never called. Every lead is lost. | Wire both forms to the API. |
| S11 | **P1** | Images | seed `cover_image_url = /images/gyms/<slug>_N.jpg`; 1642 files in [frontend/gymma/public/images/gyms](frontend/gymma/public/images) | Gym images are **relative paths served by the Next frontend**, not the API and not a CDN. `gymma-web` and `gymma-admin` (different hosts) can't resolve them; the builder's own gallery is base64. In prod only the `frontend/gymma` origin serves them. | Move images to S3/CDN, store absolute URLs. Until then, every non-`gymma` consumer shows broken images. |
| S12 | **P2** | Rate limit | [rateLimiter.ts:19](backend/gymma-api/src/middleware/rateLimiter.ts) | Limiter store is Redis. If Redis is down, `express-rate-limit` throws → requests 500 (fail-closed) unless caught; auth/inquiry/demo caps silently stop applying on reconnect races. Only `/auth`, `/inquiries`, `/demo-requests` are covered — **owner/admin/gyms have no rate limit.** | Confirm fail-mode; add a memory fallback store; consider limiting owner/admin. |
| S13 | **P2** | Authz | [auth.service.ts:69](backend/gymma-api/src/modules/auth/auth.service.ts), [:162](backend/gymma-api/src/modules/auth/auth.service.ts) | Public `POST /auth/register` hardcodes `role:'owner'`; Google-owner login auto-onboards anyone with *any* demo request (no `status` check — [demo-requests.repository.ts:26](backend/gymma-api/src/modules/demo-requests/demo-requests.repository.ts)) and force-upgrades existing users to `owner` ([admin.repository.ts:193](backend/gymma-api/src/modules/admin/admin.repository.ts)). Self-serve privilege escalation. | Register as `member`; gate owner onboarding on `status='approved'`. |
| S14 | **P2** | Dead flows | [auth.service.ts:84](backend/gymma-api/src/modules/auth/auth.service.ts) | Verify-email link has no token and no consuming endpoint/page; reset-password emails a link to a `/reset-password` page that doesn't exist in `frontend/gymma`. Both dead ends. | Add token + endpoints + pages, or remove the flows. |
| S15 | **P3** | Dep mismatch | [package.json](frontend/gymma/package.json) | Next 16.2.10 + React 18.3.1 (Next 16 wants React 19). `react-leaflet@4` pins React 18. Installed clean here, but unsupported combo; `next.config.mjs` sets `typescript.ignoreBuildErrors` + `eslint.ignoreDuringBuilds`, hiding errors. | Align React/Next versions; stop ignoring build errors. |
| S16 | **P3** | Repo hygiene | `git status` | `gymma-reviews-api` is entirely deleted from the working tree but tracked; `gymma-complete/` was a nested duplicate (removed in `0c16526`). Confusing deploy surface. | Decide reviews-api's fate; commit the deletion or restore it. |

**Confirmed non-issues (checked, OK):**
- `gyms.repository.ts` dynamic WHERE builder ([gyms.repository.ts:22](backend/gymma-api/src/modules/gyms/gyms.repository.ts)) — every value goes through the `p()` helper as a **parameterized** `$n` placeholder. No string interpolation of user input. Safe.
- `updateInquiryOwned` ([owner.repository.ts:99](backend/gymma-api/src/modules/owner/owner.repository.ts)) — `PATCH /owner/inquiries/:id` enforces ownership **in SQL** via the `owner_gym_links` join, not just middleware. Correct even though the route omits `verifyGymOwnership`.
- Owner routes — every `:gymId` route in [owner.router.ts](backend/gymma-api/src/modules/owner/owner.router.ts) has `verifyGymOwnership`; admin routes are all behind `requireRole('admin','super_admin')`.
- File upload ([s3.ts:31](backend/gymma-api/src/shared/storage/s3.ts)) — validates by **magic bytes** (not just MIME), random UUID filenames, 5 MB/10-file multer limits. Solid. (Bucket is public-read by design; no SSRF — no URL-fetch path.)
- No live secrets found in `README.md` or any `.md`. `.env`/`.env.*` are gitignored.
- A full-tree regex scan (Postgres/Redis URLs, `sk-`/`AKIA`/`AIza` keys, private-key blocks, `re_` Resend keys) surfaced only: the S1/S2 prod creds; **dev-local** `gymma:gymma@localhost` placeholders in `docker-compose.yml`, `README.md`, and `tests/setup.ts` (not production, not sensitive); and a Firebase **Android** API key in `gymma_flutter_api/.../google-services.json` (out of scope; client-embedded key restricted by app signing, not a confidential secret). S1/S2 are the only real credential P0s.

---

## 4. Part 3 details

### 4.1 Required env vars

**`frontend/gymma` (Next consumer)**
| Var | Purpose | Risk |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | API base | **Silent** fallback to `localhost:3001` ([api.ts:4](frontend/gymma/src/lib/api.ts)) and `localhost:8085` ([demo-form.tsx:6](frontend/gymma/src/components/owner/demo-form.tsx)) — inconsistent |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Owner Google login | Hardcoded prod ID fallback ([owner/login/page.tsx:10](frontend/gymma/src/app/(consumer)/owner/login/page.tsx)) |

**`gymma-admin`**: `NEXT_PUBLIC_API_URL` (fallback `https://gymma-api.onrender.com` — hardcoded prod), `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
**`frontend/gymma-web`**: none (no backend calls). Only static build.
**`backend/gymma-api`** ([env.ts](backend/gymma-api/src/config/env.ts)): `DATABASE_URL`, `REDIS_URL` (required); `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` (min 16); `ACCESS_TOKEN_TTL`/`REFRESH_TOKEN_TTL` (**unsafe 30-day defaults**); `FRONTEND_ORIGIN` (defaults `localhost:3000`, **and isn't used for CORS**); `GOOGLE_CLIENT_ID`, `STORAGE_*`, `RESEND_API_KEY`, `EMAIL_FROM` (all optional, silently empty).
**`gymma-reviews-api`**: same base + `GYMMA_PLATFORM_SALT` (required, min 16), `GYMMA_BAYESIAN_M/C`, `GYMMA_MIN_REVIEWS_PUBLIC`, `GYMMA_TIER_STABILIZATION_DAYS`.
**`broadcast-api`** ([env.ts](broadcast-api/src/config/env.ts)): base + `BULLMQ_REDIS_URL` (required), `WS_PORT`, `FCM_*` (optional), batch/WS caps.

Hardcoded hosts to remove: `localhost:3001`, `localhost:8085`, `https://gymma-api.onrender.com`, the Google client ID in `owner/login/page.tsx`.

### 4.2 Build / typecheck / lint (actually run)

| App | Command | Result |
|---|---|---|
| `frontend/gymma` | `tsc --noEmit` | **pass** (exit 0) |
| `frontend/gymma` | `next build` | **FAIL** — `TypeError: fetch failed` / `ECONNREFUSED` collecting `/gym/[slug]` (S3) |
| `frontend/gymma-web` | `vite build` (`tsc -b && vite build`) | **pass** — builds in ~0.7s |
| `frontend/gymma-web` | `oxlint` | pass (11 `only-export-components` warnings, non-blocking) |
| `gymma-admin` | `next build` | **pass** — 3 static routes |

`frontend/gymma`'s typecheck only passes because `next.config.mjs` doesn't gate on it and the config sets `ignoreBuildErrors`. The build failure is environmental (needs API), which is exactly the deploy risk.

### 4.3 Migration state

`gymma-api` migrations: `001_initial_schema.sql` (idempotent — `IF NOT EXISTS`, guarded enums/triggers), `002_add_members.sql` (idempotent, with catalog-desync guards), `002_create_materialized_view.sql`, plus TS seed scripts `003_seed_bengaluru_gyms.ts` / `004_seed_from_json.ts` / `fast_seed.ts`. **Two migrations share the `002_` prefix** — ordering relies on alphabetical (`add_members` < `create_materialized_view`), which happens to be correct since the matview reads `reviews` (from 001) not members. Fragile but not broken. `server.ts` runs migrations on every boot (self-heal). **`gymma-reviews-api`'s `001_gymma_reviews_schema.sql` depends on `gymma-api`'s tables** (shares the same DB — `users`, `owner_gym_links`, `gyms`) — it must run **after** gymma-api's migrations. Deploy ordering requirement: gymma-api first.

### 4.4 SSR/CSR

- `frontend/gymma`: `/explore`, `/search`, most landing components are `"use client"`. `/gym/[slug]` is **SSG with `generateStaticParams`** — the build-time fetch is the failure point (S3). Any build while the API sleeps breaks.
- `gymma-admin`: fully static (3 routes prerendered), all data fetched client-side — safe against API cold start.
- `frontend/gymma-web`: pure client SPA (Vite), route-level lazy chunks. No API, so no cold-start risk — but also no real data.

### 4.5 Two frontends — deployment routing

**Not wired up.** `frontend/gymma` (Next, consumer + owner dashboard) and `frontend/gymma-web` (Vite SPA, builder + a *second* set of gym/home pages) are independent apps with **overlapping scope** and incompatible stacks (Next16/React18/Tailwind3 vs Vite/React19/Tailwind4). There is no reverse-proxy, no shared routing config, no monorepo tool tying them. The builder's publish URL literally says `gymma.com/gym/<slug>` ([StepPreviewPublish.tsx:79](frontend/gymma-web/src/builder/steps/StepPreviewPublish.tsx)) but `/gym/<slug>` is *also* a route in `frontend/gymma` reading a different data source. **Someone must decide which app owns `/gym/*` and how the two are routed behind one domain** — today they'd collide.

---

## 5. DO THIS NEXT — ordered checklist

**Before any deploy (P0):**
1. **Rotate the Neon DB password and the Render Redis credentials immediately** — they're public in git (S1, S2).
2. Delete the 12 committed debug scripts (`check_mig.js`, `test_db.js`, `broadcast-api/*.js`, `diet_suggestion/*.js`) and purge them from git history.
3. Fix CORS on all three APIs to whitelist `FRONTEND_ORIGIN` instead of reflecting everything (S5).
4. Fix the `frontend/gymma` build: make `/gym/[slug]` dynamic/ISR and make `generateStaticParams` tolerate a down API (S3).
5. Decide the builder story (S4): either (a) ship `gymma-web` as an explicitly-labeled local demo, or (b) commit to building persistence — new `gym_site`/`gym_hours`/`gym_equipment` tables + owner write endpoint + public read endpoint + wiring `gymma-web` to the API (§2.5). Don't ship "publish" as if it's live.
6. Remove hardcoded localhost/onrender/Google-client-ID fallbacks; fail loudly on missing `NEXT_PUBLIC_API_URL` (S9).

**This week (P1):**
7. Move JWTs out of `localStorage` into httpOnly cookies; drop access-token TTL to ~15 min and wire `/auth/refresh` in both web clients (S6, S7).
8. Wire the inquiry modal and contact form to `POST /inquiries` — stop dropping leads (S10).
9. Remove or correctly source the fabricated sub-scores in `gym_rating_summary` (S8).
10. Move gym images to a CDN/S3 with absolute URLs (S11).

**Then (P2/P3):**
11. Gate owner onboarding on `status='approved'`; register new users as `member` not `owner` (S13).
12. Rate-limit owner/admin routes; add a Redis-down fallback for the limiter (S12).
13. Finish or delete verify-email / reset-password flows (S14).
14. Align React/Next/react-leaflet versions and stop ignoring build+lint errors (S15).
15. Resolve the two-frontend routing collision for `/gym/*` under one domain (§4.5).
16. Drop `gymma-reviews-api` and `broadcast-api` from the web deploy — no web app uses them (§2.6). Restore reviews-api to the tree only if you actually intend to run it.
