// tests/unit/tokens.test.ts
import { describe, it, expect } from 'vitest';
import {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
} from '../../src/modules/auth/tokens';

describe('tokens', () => {
  it('signs and verifies an access token round-trip', () => {
    const token = signAccessToken({ sub: 'user-1', role: 'owner' });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.role).toBe('owner');
  });

  it('rejects a tampered token', () => {
    const token = signAccessToken({ sub: 'user-1', role: 'owner' });
    expect(() => verifyAccessToken(token + 'x')).toThrow();
  });

  it('hashToken is deterministic', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
    expect(hashToken('abc')).not.toBe(hashToken('abd'));
  });

  it('generateRefreshToken produces a hash matching the token', () => {
    const { token, hash, expiresAt } = generateRefreshToken();
    expect(hash).toBe(hashToken(token));
    expect(token).toHaveLength(64); // 32 bytes hex
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
