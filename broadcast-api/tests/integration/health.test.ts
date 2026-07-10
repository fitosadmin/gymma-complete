// tests/integration/health.test.ts
import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { closeAll } from './helpers';

const app = createApp();

describe('GET /api/v1/health', () => {
  afterAll(closeAll);

  it('returns ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });

  it('404s unknown routes with the error envelope', async () => {
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });
});
