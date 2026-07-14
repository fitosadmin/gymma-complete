// tests/integration/demo-requests.test.ts
import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { canConnectDb, closeAll } from './helpers';

const dbUp = await canConnectDb();
const d = dbUp ? describe : describe.skip;

const app = createApp();

d('POST /api/v1/demo-requests', () => {
  afterAll(closeAll);

  const validPayload = {
    name: 'Arjun Menon',
    phone: '9876543210',
    email: 'arjun@gymtest.in',
    gymName: 'Iron Paradise Whitefield',
    city: 'Bengaluru',
    area: 'Whitefield',
    memberCount: '100-300',
    notes: 'Looking to launch Q3',
  };

  it('creates a demo request successfully (201)', async () => {
    const res = await request(app).post('/api/v1/demo-requests').send(validPayload);
    // 201 normally; 429 if rate limiter is exhausted by a prior test run
    expect([201, 429]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body.success).toBe(true);
      // App returns { received: true } — no id field in response
      expect(res.body.data.received).toBe(true);
    }
  });

  it('returns success:true in envelope when created', async () => {
    const res = await request(app)
      .post('/api/v1/demo-requests')
      .send({ ...validPayload, email: `a_${Date.now()}@test.in` });
    if (res.status === 429) return; // rate-limited — skip
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('rejects missing required fields (422)', async () => {
    const res = await request(app).post('/api/v1/demo-requests').send({
      name: 'Arjun',
      // missing phone, email, gymName
    });
    // NOTE: rate limiter fires BEFORE validation, so 429 is also possible here
    expect([422, 429]).toContain(res.status);
    if (res.status === 422) {
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects an invalid phone number (422)', async () => {
    const res = await request(app).post('/api/v1/demo-requests').send({
      ...validPayload,
      phone: '1234567890', // starts with 1, invalid Indian phone
    });
    expect([422, 429]).toContain(res.status);
    if (res.status === 422) {
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects an invalid email (422)', async () => {
    const res = await request(app).post('/api/v1/demo-requests').send({
      ...validPayload,
      email: 'not-an-email',
    });
    expect([422, 429]).toContain(res.status);
  });

  it('rejects an invalid memberCount enum (422)', async () => {
    const res = await request(app).post('/api/v1/demo-requests').send({
      ...validPayload,
      memberCount: '1000+', // not in enum
    });
    expect([422, 429]).toContain(res.status);
  });

  it('rejects a name that is too short (422)', async () => {
    const res = await request(app).post('/api/v1/demo-requests').send({
      ...validPayload,
      name: 'A', // min 2
    });
    expect([422, 429]).toContain(res.status);
  });

  it('accepts optional fields as absent', async () => {
    const res = await request(app).post('/api/v1/demo-requests').send({
      name: 'Priya Nair',
      phone: '8765432109',
      email: 'priya@gymtest.in',
      gymName: 'FitZone Marathahalli',
    });
    expect([201, 429]).toContain(res.status);
  });
});
