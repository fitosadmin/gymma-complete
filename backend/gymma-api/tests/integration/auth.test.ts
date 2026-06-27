// tests/integration/auth.test.ts
import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { canConnectDb, closeAll } from './helpers';

const dbUp = await canConnectDb();
const d = dbUp ? describe : describe.skip;

const app = createApp();

d('auth flow (requires migrated test DB)', () => {
  afterAll(closeAll);

  const email = `owner_${Date.now()}@test.in`;
  const password = 'Passw0rd1';
  let accessToken = '';
  let refreshToken = '';

  it('registers a new owner', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password, fullName: 'Test Owner' });
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.accessToken).toBeTruthy();
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('rejects duplicate registration (409)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password, fullName: 'Dup' });
    expect(res.status).toBe(409);
  });

  it('rejects weak passwords (422)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: `w_${Date.now()}@test.in`, password: 'weak', fullName: 'W' });
    expect(res.status).toBe(422);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('rejects wrong password (401)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'WrongPass1' });
    expect(res.status).toBe(401);
  });

  it('returns the current user from /me', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(email);
    expect(res.body.data.role).toBe('owner');
  });

  it('blocks /me without a token (401)', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('rotates the refresh token', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data.refreshToken).toBeTruthy();
    expect(res.body.data.refreshToken).not.toBe(refreshToken);

    // old token is now revoked
    const reuse = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(reuse.status).toBe(401);
  });
});
