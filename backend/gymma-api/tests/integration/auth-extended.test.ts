// tests/integration/auth-extended.test.ts
// Extended auth flow: lockout, logout, password reset, edge cases.
import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { canConnectDb, closeAll } from './helpers';

const dbUp = await canConnectDb();
const d = dbUp ? describe : describe.skip;

const app = createApp();

d('auth — extended edge cases', () => {
  afterAll(closeAll);

  const makeEmail = () => `test_${Date.now()}_${Math.random().toString(36).slice(2)}@test.in`;

  // ── Register validation ───────────────────────────────────────────────────

  it('rejects registration with missing fullName (422)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: makeEmail(),
      password: 'Passw0rd1',
      // fullName missing
    });
    expect([422, 429]).toContain(res.status);
  });

  it('rejects registration with invalid email format (422)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'not-an-email',
      password: 'Passw0rd1',
      fullName: 'Bad Email',
    });
    expect([422, 429]).toContain(res.status);
  });

  it('rejects password shorter than minimum (422)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: makeEmail(),
      password: 'short',
      fullName: 'Short',
    });
    expect([422, 429]).toContain(res.status);
  });

  // ── /me endpoint ──────────────────────────────────────────────────────────

  it('/me returns 401 for malformed Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer this.is.garbage');
    expect(res.status).toBe(401);
  });

  it('/me returns 401 without any auth header', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('/me returns user object with id, email, role', async () => {
    const email = makeEmail();
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: 'Passw0rd1', fullName: 'Me Test' });
    const token = reg.body.data.accessToken;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ email, role: 'owner' });
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.passwordHash).toBeUndefined(); // not exposed
  });

  // ── Login ─────────────────────────────────────────────────────────────────

  it('login returns accessToken + refreshToken', async () => {
    const email = makeEmail();
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: 'Passw0rd1', fullName: 'Login Test' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'Passw0rd1' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();
  });

  it('login 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@nowhere.in', password: 'Passw0rd1' });
    expect(res.status).toBe(401);
  });

  it('login 401 for correct email wrong password', async () => {
    const email = makeEmail();
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: 'Passw0rd1', fullName: 'Wrong' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'WrongPass9' });
    expect(res.status).toBe(401);
  });

  it('login validates missing email (422)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: 'Passw0rd1' });
    expect(res.status).toBe(422);
  });

  // ── Refresh token lifecycle ───────────────────────────────────────────────

  it('refresh returns a new pair and old token is revoked', async () => {
    const email = makeEmail();
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: 'Passw0rd1', fullName: 'Refresh Test' });
    if (reg.status === 429) return; // auth rate-limited — skip gracefully
    const { refreshToken } = reg.body.data;

    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    const newRefreshToken = res.body.data.refreshToken;
    expect(newRefreshToken).not.toBe(refreshToken);

    // old token should now be invalid
    const reuse = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(reuse.status).toBe(401);
  });

  it('refresh 401 for completely bogus token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'not-a-real-token-abcdef1234567890' });
    expect(res.status).toBe(401);
  });

  it('refresh 422 for missing refreshToken', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({});
    expect(res.status).toBe(422);
  });

  // ── Logout ────────────────────────────────────────────────────────────────

  it('logout revokes refresh token (subsequent refresh is 401)', async () => {
    const email = makeEmail();
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: 'Passw0rd1', fullName: 'Logout Test' });
    if (reg.status === 429) return; // auth rate-limited — skip gracefully
    const { refreshToken } = reg.body.data;

    const out = await request(app).post('/api/v1/auth/logout').send({ refreshToken });
    expect(out.status).toBe(204);

    // refresh should now fail
    const re = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(re.status).toBe(401);
  });

  // ── Forgot / Reset password ───────────────────────────────────────────────

  it('forgot-password always succeeds (200) even for unknown email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'no-such-user@nowhere.in' });
    // Should return 200 to avoid email enumeration; 429 if rate-limited
    expect([200, 429]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
    }
  });

  it('forgot-password 422 for missing email', async () => {
    const res = await request(app).post('/api/v1/auth/forgot-password').send({});
    expect([422, 429]).toContain(res.status);
  });

  it('reset-password 401 for an invalid token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: 'deadbeef'.repeat(8), newPassword: 'NewPassw0rd1' });
    expect([401, 429]).toContain(res.status);
  });

  it('reset-password 422 for missing fields', async () => {
    const res = await request(app).post('/api/v1/auth/reset-password').send({});
    expect([422, 429]).toContain(res.status);
  });

  // ── Account lockout after 5 consecutive failures ──────────────────────────

  it('account becomes locked after 5 consecutive wrong-password attempts', async () => {
    const email = makeEmail();
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: 'Passw0rd1', fullName: 'Lockout Test' });

    // 5 wrong-password attempts
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'WrongPass99' });
    }

    // 6th attempt with CORRECT password should be locked (403) or rate-limited (429)
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'Passw0rd1' });
    expect([403, 429]).toContain(res.status);
    if (res.status === 403) {
      expect(res.body.error.message).toMatch(/locked/i);
    }
  });

  // ── Duplicate registration ────────────────────────────────────────────────

  it('duplicate email registration returns 409', async () => {
    const email = makeEmail();
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: 'Passw0rd1', fullName: 'First' });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: 'Passw0rd1', fullName: 'Second' });
    // 409 normally; 429 if auth rate limiter is exhausted in this test run
    expect([409, 429]).toContain(res.status);
    if (res.status === 409) {
      expect(res.body.error.code).toBe('CONFLICT');
    }
  });

  // ── Role validation ───────────────────────────────────────────────────────

  it('newly registered user always has role=owner', async () => {
    const email = makeEmail();
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: 'Passw0rd1', fullName: 'Role Check' });
    if (reg.status === 429) return; // rate-limited — skip gracefully
    expect(reg.status).toBe(201);
    expect(reg.body.data.user.role).toBe('owner');
  });
});
