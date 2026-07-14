// tests/integration/auth.test.ts
// Auth/authorization rejection paths — these fail out of the middleware
// chain before touching Postgres or Redis, so they run without a live DB.
import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createApp } from '../../src/app';
import { closeAll, mintAccessToken } from './helpers';

const app = createApp();

describe('broadcast auth & authorization', () => {
  afterAll(closeAll);

  it('401s POST /broadcasts with no token', async () => {
    const res = await request(app).post('/api/v1/broadcasts').send({
      gym_id: randomUUID(),
      title: 'Hello',
      message: 'World',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('401s GET /broadcasts with an invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/broadcasts')
      .query({ gym_id: randomUUID() })
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('422s POST /broadcasts with a missing title before auth-role is even checked', async () => {
    const token = mintAccessToken({ sub: randomUUID(), role: 'admin' });
    const res = await request(app)
      .post('/api/v1/broadcasts')
      .set('Authorization', `Bearer ${token}`)
      .send({ gym_id: randomUUID(), message: 'World' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('403s POST /broadcasts for a plain member (not a gym owner/admin)', async () => {
    const token = mintAccessToken({ sub: randomUUID(), role: 'member' });
    const res = await request(app)
      .post('/api/v1/broadcasts')
      .set('Authorization', `Bearer ${token}`)
      .send({ gym_id: randomUUID(), title: 'Hello', message: 'World' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('401s POST /users/fcm-token with no token', async () => {
    const res = await request(app).post('/api/v1/users/fcm-token').send({
      token: 'fcm-token-value',
      platform: 'android',
    });
    expect(res.status).toBe(401);
  });

  it('422s POST /users/fcm-token with an invalid platform', async () => {
    const token = mintAccessToken({ sub: randomUUID(), role: 'member' });
    const res = await request(app)
      .post('/api/v1/users/fcm-token')
      .set('Authorization', `Bearer ${token}`)
      .send({ token: 'fcm-token-value', platform: 'windows-phone' });
    expect(res.status).toBe(422);
  });
});
