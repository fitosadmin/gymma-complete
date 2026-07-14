# Gymma API

Backend for Gymma — gym discovery for Bengaluru.
Stack: **Express · TypeScript · PostgreSQL (PostGIS) · Redis**.

## Status

| Sprint | Scope | State |
|---|---|---|
| 1 | Core read APIs (gyms list/detail/reviews) | ✅ built |
| 2 | Lead capture (inquiries, demo-requests) | ✅ built |
| 3 | Auth (email + Google, JWT + refresh) | ✅ built |
| 4 | Owner dashboard | ✅ built |
| 5 | Admin panel | ✅ built |
| 6 | Hardening (health, cron, tests, graceful shutdown) | ✅ built — Sentry optional |

## Quick start (Docker)

```bash
cp .env.example .env          # fill secrets (or use compose defaults)
docker compose up -d db redis
docker compose up api         # or: npm run dev (local)
npm run migrate               # applies migrations/*.sql in order
npm run seed                  # inserts sample Bengaluru gyms
```

## Quick start (local, no Docker for API)

```bash
npm install
npm run migrate
npm run seed
npm run dev
```

## Endpoints

```
GET    /api/v1/health

# public — gyms & reviews
GET    /api/v1/gyms                       # filter/sort/paginate
GET    /api/v1/gyms/:slug                 # full detail (single round-trip)
GET    /api/v1/gyms/:slug/reviews         # paginated, sort=recent|helpful

# public — leads (rate limited)
POST   /api/v1/inquiries                  # 5/IP/hour
POST   /api/v1/demo-requests              # 3/IP/day

# auth
POST   /api/v1/auth/register
POST   /api/v1/auth/login                 # lockout after 5 fails
POST   /api/v1/auth/google                # verifies Google ID token
POST   /api/v1/auth/refresh               # rotates refresh token
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/me                    # Bearer access token

# owner (Bearer, role=owner, ownership-checked)
GET    /api/v1/owner/gyms
GET    /api/v1/owner/gyms/:gymId/stats
GET    /api/v1/owner/gyms/:gymId/inquiries
PATCH  /api/v1/owner/inquiries/:id
PUT    /api/v1/owner/gyms/:gymId
POST   /api/v1/owner/gyms/:gymId/gallery  # multipart, ≤10 imgs, 5MB each

# admin (Bearer, role=admin|super_admin)
GET    /api/v1/admin/gyms
POST   /api/v1/admin/gyms
PUT    /api/v1/admin/gyms/:id
DELETE /api/v1/admin/gyms/:id             # soft delete
POST   /api/v1/admin/gyms/:id/owner       # link owner account
GET    /api/v1/admin/inquiries
GET    /api/v1/admin/demo-requests
PATCH  /api/v1/admin/demo-requests/:id
```

### `GET /gyms` query params
`q, city, area, amenities[], women_friendly, has_parking, is_open_now,`
`price_min, price_max, lat, lng, distance_km, sort, page, limit`

- `sort`: `relevance | distance | rating | price_asc`
- `distance_km` requires `lat` + `lng`
- prices in/out are **rupees** (stored as paise internally)

Try:
```
/api/v1/gyms?city=Bengaluru&women_friendly=true&sort=rating
/api/v1/gyms?lat=12.9716&lng=77.6412&distance_km=5&sort=distance
/api/v1/gyms?amenities=Sauna&amenities=AC
/api/v1/gyms/cult-fit-indiranagar
```

## Response envelope

```jsonc
{ "success": true, "data": ..., "meta": { "page":1,"limit":20,"total":3,"totalPages":1 } }
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Gym not found" } }
```

## Notes / decisions

- **Prices** stored as integer paise; API maps to rupees on the way out.
- **`location`** auto-synced from `lat`/`lng` via trigger — never set it by hand.
- **Rating summary** is a materialized view. The spec's CONCURRENTLY-in-trigger
  approach can't run inside a transaction, so refresh is a callable function
  (`refresh_gym_rating_summary()`) used by the seed and (Sprint 2+) review writes.
- **`is_open_now`** computed against Asia/Kolkata time; overnight (cross-midnight)
  hours aren't modelled yet — fine for MVP.
- Seed data here is a standalone sample. Swap in the frontend's
  `gyms.generated.ts` for the real 40-gym dataset (see header of
  `migrations/003_seed_bengaluru_gyms.ts`).
- **Passwords** use `bcryptjs` (cost 12) instead of native `bcrypt` — same
  algorithm, no native build step (avoids node-gyp issues on deploy).
- **Refresh tokens** are 256-bit random strings stored as a SHA-256 hash
  (deterministic, indexable, UNIQUE). The spec said bcrypt, but bcrypt's
  per-call salt makes lookup-by-hash impossible; a fast hash is safe for
  high-entropy random tokens. Rotated on every `/auth/refresh`.
- **First admin:** `register` only creates `owner` accounts. Promote one
  manually once: `UPDATE users SET role='super_admin' WHERE email='you@x.in';`
- **Gallery upload** needs the `STORAGE_*` env vars (Cloudflare R2 / S3). Without
  them the endpoint returns `503 storage not configured`; everything else runs.
- **Daily stats cron:** schedule `tsx src/jobs/aggregateDailyStats.ts` (or the
  built `dist/...`) once a day.

## Tests

```bash
npm test                 # all tests (vitest)
npx vitest run tests/unit   # unit only — no infra needed
```

- **Unit tests** (slugify, pagination, tokens, envelope, schemas) run anywhere — 20 tests, no DB/Redis.
- **Integration tests** (health, gyms, auth, inquiries) use Supertest against the
  real app. The DB-backed suites **auto-skip** if no Postgres is reachable, so
  CI without infra stays green. To run them fully:

  ```bash
  createdb gymma_test    # or point DATABASE_URL at a test DB
  DATABASE_URL=postgresql://gymma:gymma@localhost:5432/gymma_test npm run migrate
  DATABASE_URL=postgresql://gymma:gymma@localhost:5432/gymma_test npm run seed
  DATABASE_URL=postgresql://gymma:gymma@localhost:5432/gymma_test npm test
  ```

## Scripts

```
npm run dev        # tsx watch
npm run build      # tsc -> dist
npm start          # node dist/server.js
npm run migrate    # run SQL migrations
npm run seed       # seed sample data
npm run typecheck  # tsc --noEmit
```
