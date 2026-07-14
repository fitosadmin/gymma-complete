// tests/integration/rate-limit.test.ts
// Verifies the 10-broadcasts/hour-per-sender limiter, keyed
// `rate_limit:broadcasts:{senderId}` in Redis, independent of Postgres.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import express from 'express';
import { requireAuth } from '../../src/middleware/auth';
import { rateLimitBroadcasts } from '../../src/broadcast/middleware/rate-limit-broadcasts.middleware';
import { redis } from '../../src/config/redis';
import { canConnectRedis, mintAccessToken } from './helpers';

const redisUp = await canConnectRedis();
const d = redisUp ? describe : describe.skip;

d('rateLimitBroadcasts middleware', () => {
  const adminId = randomUUID();
  const token = mintAccessToken({ sub: adminId, role: 'admin' });

  // Minimal app: just enough middleware to exercise the limiter without
  // needing the full broadcast pipeline (DB, BullMQ, etc).
  const app = express();
  app.use(requireAuth, rateLimitBroadcasts, (_req, res) => res.status(201).json({ success: true }));

  beforeAll(async () => {
    await redis.del(`rate_limit:broadcasts:${adminId}`);
  });

  afterAll(async () => {
    await redis.del(`rate_limit:broadcasts:${adminId}`);
    redis.disconnect();
  });

  it('allows the first 10 requests within the hour and rejects the 11th', async () => {
    for (let i = 0; i < 10; i += 1) {
      const res = await request(app).post('/').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(201);
    }

    const eleventh = await request(app).post('/').set('Authorization', `Bearer ${token}`);
    expect(eleventh.status).toBe(429);
    expect(eleventh.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(eleventh.body.error.details.retry_after).toBeGreaterThan(0);
  });
});
