// tests/integration/broadcasts.test.ts
// Full create -> list -> read -> delete flow. Requires a migrated Postgres
// test DB that ALSO has the shared platform's `gyms`, `users`, `gym_members`,
// and `owner_gym_links` tables (this service runs against the same database
// as gymma-api) to seed a fixture gym/owner/member. Skips gracefully if
// unavailable, mirroring the rest of this monorepo's integration test style.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createApp } from '../../src/app';
import { pool } from '../../src/config/database';
import { redis } from '../../src/config/redis';
import { canConnectDb, canConnectRedis, closeAll, mintAccessToken } from './helpers';

const app = createApp();

const gymId = randomUUID();
const ownerId = randomUUID();
const memberId = randomUUID();

async function canSeedFixtures(): Promise<boolean> {
  try {
    await pool.query('SELECT 1 FROM gyms LIMIT 1');
    await pool.query('SELECT 1 FROM users LIMIT 1');
    await pool.query('SELECT 1 FROM gym_members LIMIT 1');
    await pool.query('SELECT 1 FROM owner_gym_links LIMIT 1');

    await pool.query(
      `INSERT INTO gyms (id, slug, name, area, lat, lng, price_per_month)
       VALUES ($1, $2, 'Broadcast Test Gym', 'Test Area', 12.9716, 77.5946, 100000)`,
      [gymId, `broadcast-test-gym-${gymId}`],
    );
    await pool.query(
      `INSERT INTO users (id, email, full_name, role) VALUES ($1, $2, 'Owner Fixture', 'owner')`,
      [ownerId, `owner-${ownerId}@example.test`],
    );
    await pool.query(
      `INSERT INTO users (id, email, full_name, role) VALUES ($1, $2, 'Member Fixture', 'member')`,
      [memberId, `member-${memberId}@example.test`],
    );
    await pool.query('INSERT INTO owner_gym_links (user_id, gym_id) VALUES ($1, $2)', [ownerId, gymId]);
    await pool.query('INSERT INTO gym_members (gym_id, user_id) VALUES ($1, $2)', [gymId, memberId]);
    return true;
  } catch {
    return false;
  }
}

async function cleanupFixtures(): Promise<void> {
  // Deleting the gym cascades to owner_gym_links, gym_members, and broadcasts
  // (which cascades broadcast_receipts) — see the FKs in migrations/001_broadcasts.sql.
  await pool.query('DELETE FROM gyms WHERE id = $1', [gymId]).catch(() => undefined);
  await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [[ownerId, memberId]]).catch(() => undefined);
}

const dbUp = await canConnectDb();
const redisUp = dbUp ? await canConnectRedis() : false;
const seeded = dbUp && redisUp ? await canSeedFixtures() : false;
const d = seeded ? describe : describe.skip;

d('broadcast create -> list -> read -> delete flow', () => {
  const ownerToken = mintAccessToken({ sub: ownerId, role: 'owner' });
  const memberToken = mintAccessToken({ sub: memberId, role: 'member' });
  let broadcastId: string;

  beforeAll(async () => {
    await redis.del(`rate_limit:broadcasts:${ownerId}`);
  });

  afterAll(async () => {
    await cleanupFixtures();
    await closeAll();
  });

  it('creates a broadcast as the gym owner', async () => {
    const res = await request(app)
      .post('/api/v1/broadcasts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ gym_id: gymId, title: 'Gym closed Sunday', message: 'See you Monday!' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('sent');
    expect(res.body.data.estimated_reach).toBeGreaterThanOrEqual(1);
    broadcastId = res.body.data.broadcast_id;
  });

  it('403s when an owner of a DIFFERENT gym tries to broadcast to this one', async () => {
    const outsiderToken = mintAccessToken({ sub: randomUUID(), role: 'owner' });
    const res = await request(app)
      .post('/api/v1/broadcasts')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ gym_id: gymId, title: 'Nope', message: 'Should be rejected' });
    expect(res.status).toBe(403);
  });

  it('403s when a plain member tries to broadcast', async () => {
    const res = await request(app)
      .post('/api/v1/broadcasts')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ gym_id: gymId, title: 'Nope', message: 'Members cannot send' });
    expect(res.status).toBe(403);
  });

  it('lists broadcasts for an active gym member with pagination meta', async () => {
    const res = await request(app)
      .get('/api/v1/broadcasts')
      .query({ gym_id: gymId, page: 1, limit: 10 })
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 10 });
    expect(res.headers['x-total-unread']).toBeDefined();
    expect(res.body.data.some((b: { id: string }) => b.id === broadcastId)).toBe(true);
  });

  it('gets a single broadcast with sender info', async () => {
    const res = await request(app)
      .get(`/api/v1/broadcasts/${broadcastId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(broadcastId);
    expect(res.body.data.title).toBe('Gym closed Sunday');
  });

  it('the owner sees receipt_stats, the member does not', async () => {
    const ownerView = await request(app)
      .get(`/api/v1/broadcasts/${broadcastId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(ownerView.body.data.receipt_stats).toBeDefined();

    const memberView = await request(app)
      .get(`/api/v1/broadcasts/${broadcastId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(memberView.body.data.receipt_stats).toBeUndefined();
  });

  it('marks a broadcast read idempotently', async () => {
    const first = await request(app)
      .patch(`/api/v1/broadcasts/${broadcastId}/read`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(first.status).toBe(204);

    const second = await request(app)
      .patch(`/api/v1/broadcasts/${broadcastId}/read`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(second.status).toBe(204);

    const list = await request(app)
      .get('/api/v1/broadcasts')
      .query({ gym_id: gymId, unread_only: 'true' })
      .set('Authorization', `Bearer ${memberToken}`);
    expect(list.body.data.some((b: { id: string }) => b.id === broadcastId)).toBe(false);
  });

  it('403s deleting the broadcast as anyone other than its sender', async () => {
    const someoneElseToken = mintAccessToken({ sub: randomUUID(), role: 'owner' });
    const res = await request(app)
      .delete(`/api/v1/broadcasts/${broadcastId}`)
      .set('Authorization', `Bearer ${someoneElseToken}`);
    expect(res.status).toBe(403);
  });

  it('deletes (soft) the broadcast as its sender', async () => {
    const res = await request(app)
      .delete(`/api/v1/broadcasts/${broadcastId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(204);

    const getRes = await request(app)
      .get(`/api/v1/broadcasts/${broadcastId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(getRes.status).toBe(404);
  });
});
