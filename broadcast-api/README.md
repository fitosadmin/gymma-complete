# Broadcast API

Gym-wide broadcast messaging for Gymma — a gym owner announces something and
their active members get it via REST, Socket.io, and push (FCM).
Stack: **Express · TypeScript · PostgreSQL · Redis · Socket.io · BullMQ · Firebase Admin**.

Runs against the **same Postgres database and Redis instance as `backend/gymma-api`**.
It reads `gyms`, `users`, `gym_members`, and `owner_gym_links` from there and
adds its own `broadcasts`, `broadcast_receipts`, `user_devices`, and
`device_push_failures` tables via its own migration.

## Local setup

```bash
cp .env.example .env   # copy DATABASE_URL / REDIS_URL / ACCESS_TOKEN_SECRET
                        # from gymma-api's values — they must match
npm install
npm run migrate         # applies migrations/*.sql (adds the 4 new tables)
npm run dev              # REST (:3002) + WebSocket (:3001)
npm run worker            # separate process — BullMQ workers (in another terminal)
```

Both `npm run dev` and `npm run worker` need to be running for broadcasts to
actually fan out to receipts and send push notifications — the API process
only inserts the broadcast row and hands the rest off to the queue.

## Deploying on Render (mirrors gymma-api's setup)

This needs **two Render services**, both built from this repo's `broadcast-api/`
root directory using the included `Dockerfile`:

1. **Web service** (`broadcast-api`) — runs the REST API + WebSocket server
   - Root directory: `broadcast-api`
   - Environment: Docker
   - Env vars: copy `DATABASE_URL`, `REDIS_URL`, `ACCESS_TOKEN_SECRET` **values** from
     the existing `gymma-api` Render service (Environment tab → Edit → copy), plus
     set `FCM_PROJECT_ID` / `FCM_CLIENT_EMAIL` / `FCM_PRIVATE_KEY` from a Firebase
     service account
   - Render auto-assigns `$PORT` — either read it into `PORT`, or leave the app's
     own `PORT` default and set Render's port mapping to `3002`

2. **Background worker service** (`broadcast-worker`) — runs the BullMQ workers
   - Same repo, same root directory, same Dockerfile
   - Service type: **Background Worker** (not Web Service — it has no HTTP port)
   - Docker Command override: `node dist/worker.js`
   - Same env vars as the web service

3. **Run the migration once**, either via Render's Shell tab on the web service
   (`npm run migrate`) or as a Render One-Off Job.

Both services being on Render's free tier will spin down with inactivity —
same caveat gymma-api already has (~50s cold-start delay).

## Auth model

There's no generic "admin" role that can message any gym. A broadcast sender
must be one of:
- The gym's owner (`owner_gym_links.user_id` = the gym in question)
- A platform `admin` / `super_admin`
- A user whose JWT carries the `broadcast` permission

Recipients are gym members with `gym_members.status = 'active' AND deleted_at IS NULL`
for that specific gym — matching how `owner.repository.ts`'s
`addMemberToGym`/`removeMemberFromGym` already manage membership in gymma-api.

## Endpoints

```
POST   /api/v1/broadcasts              create + fan out a broadcast (gym owner/admin)
GET    /api/v1/broadcasts              paginated list for the caller's gym
GET    /api/v1/broadcasts/:id          single broadcast (+ receipt_stats for owner/admin)
PATCH  /api/v1/broadcasts/:id/read     mark read (idempotent)
DELETE /api/v1/broadcasts/:id          soft delete (sender or super_admin only)
POST   /api/v1/users/fcm-token         register a device for push
GET    /api/v1/health
GET    /api/v1/metrics
```

WebSocket: connect to `/ws/broadcasts` namespace on `WS_PORT` with
`auth: { token: "<JWT>" }` — the server auto-joins the caller's gym rooms.
