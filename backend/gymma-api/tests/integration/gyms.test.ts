// tests/integration/gyms.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { canConnectDb, closeAll } from './helpers';

// Skips the whole suite if no test DB is reachable.
const dbUp = await canConnectDb();
const d = dbUp ? describe : describe.skip;

const app = createApp();

d('GET /api/v1/gyms (requires seeded test DB)', () => {
  afterAll(closeAll);

  beforeAll(() => {
    if (!dbUp) return;
  });

  it('lists gyms with pagination meta', async () => {
    const res = await request(app).get('/api/v1/gyms?city=Bengaluru');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('totalPages');
  });

  it('validates bad query params (422)', async () => {
    const res = await request(app).get('/api/v1/gyms?sort=banana');
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns prices in rupees, not paise', async () => {
    const res = await request(app).get('/api/v1/gyms?limit=1');
    if (res.body.data.length > 0) {
      // sample seed gyms are 1.5k–3k rupees, never 6-figure paise
      expect(res.body.data[0].pricePerMonth).toBeLessThan(100_000);
    }
  });

  it('404s an unknown slug', async () => {
    const res = await request(app).get('/api/v1/gyms/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
