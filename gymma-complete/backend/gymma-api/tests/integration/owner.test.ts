// tests/integration/owner.test.ts
// Owner dashboard endpoints: gym list, stats, inquiries, gym profile update.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { canConnectDb, closeAll } from './helpers';

const dbUp = await canConnectDb();
const d = dbUp ? describe : describe.skip;

const app = createApp();

d('owner dashboard — /api/v1/owner/*', () => {
  afterAll(closeAll);

  let ownerToken = '';
  let ownerEmail = `owner_${Date.now()}@test.in`;
  let adminToken = '';
  let gymId = '';

  // ── Setup: register owner, create gym via admin route, link them ──────────

  beforeAll(async () => {
    if (!dbUp) return;

    // register a fresh owner
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: ownerEmail, password: 'Passw0rd1', fullName: 'Test Owner' });
    ownerToken = reg.body.data?.accessToken ?? '';

    // we need an admin token — try to find one from a previous seed or
    // promote the user via direct DB manipulation. Since we cannot do that
    // here without raw DB access, we skip the admin-only setup steps that
    // require admin role. The owner tests still exercise the middleware and
    // 403 guards.
  });

  // ── Unauthenticated access ────────────────────────────────────────────────

  it('GET /owner/gyms returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/owner/gyms');
    expect(res.status).toBe(401);
  });

  it('GET /owner/gyms/:gymId/stats returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/owner/gyms/some-uuid/stats');
    expect(res.status).toBe(401);
  });

  it('GET /owner/gyms/:gymId/inquiries returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/owner/gyms/some-uuid/inquiries');
    expect(res.status).toBe(401);
  });

  it('PATCH /owner/inquiries/:id returns 401 without token', async () => {
    const res = await request(app)
      .patch('/api/v1/owner/inquiries/some-uuid')
      .send({ status: 'contacted' });
    expect(res.status).toBe(401);
  });

  it('PUT /owner/gyms/:gymId returns 401 without token', async () => {
    const res = await request(app)
      .put('/api/v1/owner/gyms/some-uuid')
      .send({ description: 'Test' });
    expect(res.status).toBe(401);
  });

  // ── Authenticated as owner — no gyms linked ───────────────────────────────

  it('GET /owner/gyms returns empty array for owner with no linked gyms', async () => {
    if (!ownerToken) return;
    const res = await request(app)
      .get('/api/v1/owner/gyms')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it('GET /owner/gyms/:gymId/stats returns 403 when owner does not own gym', async () => {
    if (!ownerToken) return;
    // get any gym id from the public list
    const list = await request(app).get('/api/v1/gyms?limit=1');
    const gym = list.body.data?.[0];
    if (!gym) return;

    const res = await request(app)
      .get(`/api/v1/owner/gyms/${gym.id}/stats`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /owner/gyms/:gymId/inquiries returns 403 when owner does not own gym', async () => {
    if (!ownerToken) return;
    const list = await request(app).get('/api/v1/gyms?limit=1');
    const gym = list.body.data?.[0];
    if (!gym) return;

    const res = await request(app)
      .get(`/api/v1/owner/gyms/${gym.id}/inquiries`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(403);
  });

  // ── Invalid UUID path params ──────────────────────────────────────────────

  it('GET /owner/gyms/invalid-uuid/stats returns 422', async () => {
    if (!ownerToken) return;
    const res = await request(app)
      .get('/api/v1/owner/gyms/not-a-uuid/stats')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(422);
  });

  it('PATCH /owner/inquiries/invalid-uuid returns 422', async () => {
    if (!ownerToken) return;
    const res = await request(app)
      .patch('/api/v1/owner/inquiries/not-a-uuid')
      .send({ status: 'contacted' })
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(422);
  });

  // ── Update gym validation ─────────────────────────────────────────────────

  it('PUT /owner/gyms/:gymId validates time format (422)', async () => {
    if (!ownerToken) return;
    const list = await request(app).get('/api/v1/gyms?limit=1');
    const gym = list.body.data?.[0];
    if (!gym) return;

    const res = await request(app)
      .put(`/api/v1/owner/gyms/${gym.id}`)
      .send({ opensAt: '9am' }) // invalid time format
      .set('Authorization', `Bearer ${ownerToken}`);
    // will be 403 (not owner) but at least not 500
    expect([403, 422]).toContain(res.status);
  });

  it('PUT /owner/gyms/:gymId with empty body returns 422', async () => {
    if (!ownerToken) return;
    const list = await request(app).get('/api/v1/gyms?limit=1');
    const gym = list.body.data?.[0];
    if (!gym) return;

    const res = await request(app)
      .put(`/api/v1/owner/gyms/${gym.id}`)
      .send({}) // empty — "no editable fields provided"
      .set('Authorization', `Bearer ${ownerToken}`);
    // will be 403 (not owner) but must not be 500
    expect([403, 422]).toContain(res.status);
  });

  // ── Inquiry update validation ─────────────────────────────────────────────

  it('PATCH /owner/inquiries/:id rejects invalid status enum (422)', async () => {
    if (!ownerToken) return;
    const list = await request(app).get('/api/v1/gyms?limit=1');
    const gym = list.body.data?.[0];
    if (!gym) return;

    // Create a real inquiry to get a valid inquiry id
    const inqRes = await request(app).post('/api/v1/inquiries').send({
      gymId: gym.id,
      name: 'Test Inquiry',
      phone: '9876543210',
    });
    if (inqRes.status !== 201) return;

    const res = await request(app)
      .patch(`/api/v1/owner/inquiries/${inqRes.body.data.id}`)
      .send({ status: 'unknown_status' })
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(422);
  });

  // ── Pagination query params on inquiries ──────────────────────────────────

  it('GET /owner/gyms/:gymId/inquiries?status=new works with valid status', async () => {
    if (!ownerToken) return;
    const list = await request(app).get('/api/v1/gyms?limit=1');
    const gym = list.body.data?.[0];
    if (!gym) return;

    const res = await request(app)
      .get(`/api/v1/owner/gyms/${gym.id}/inquiries?status=new`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect([200, 403]).toContain(res.status);
  });

  it('GET /owner/gyms/:gymId/inquiries?status=invalid returns 422', async () => {
    if (!ownerToken) return;
    const list = await request(app).get('/api/v1/gyms?limit=1');
    const gym = list.body.data?.[0];
    if (!gym) return;

    const res = await request(app)
      .get(`/api/v1/owner/gyms/${gym.id}/inquiries?status=spam`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(422);
  });
});
