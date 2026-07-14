// tests/integration/inquiries.test.ts
import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { canConnectDb, closeAll } from './helpers';

const dbUp = await canConnectDb();
const d = dbUp ? describe : describe.skip;

const app = createApp();

d('POST /api/v1/inquiries (requires seeded test DB)', () => {
  afterAll(closeAll);

  it('rejects an invalid phone (422)', async () => {
    const res = await request(app).post('/api/v1/inquiries').send({
      gymId: '11111111-1111-1111-1111-111111111111',
      name: 'Rahul',
      phone: '12345',
    });
    expect(res.status).toBe(422);
  });

  it('404s for a non-existent gym', async () => {
    const res = await request(app).post('/api/v1/inquiries').send({
      gymId: '11111111-1111-1111-1111-111111111111',
      name: 'Rahul',
      phone: '9876543210',
    });
    expect(res.status).toBe(404);
  });

  it('creates an inquiry against a real seeded gym', async () => {
    const list = await request(app).get('/api/v1/gyms?limit=1');
    const gym = list.body.data?.[0];
    if (!gym) return; // unseeded DB — nothing to attach to

    const res = await request(app).post('/api/v1/inquiries').send({
      gymId: gym.id,
      name: 'Rahul Sharma',
      phone: '9876543210',
      message: 'Interested in the annual plan',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeTruthy();
  });
});
