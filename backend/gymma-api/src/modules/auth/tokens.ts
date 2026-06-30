// src/modules/auth/tokens.ts
import { randomBytes, createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export interface AccessPayload extends jwt.JwtPayload {
  sub: string;
  role: 'owner' | 'admin' | 'super_admin' | 'member';
}

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
  });
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
  return decoded as AccessPayload;
}

/**
 * Refresh tokens are 256-bit random strings. We store a deterministic SHA-256
 * hash (indexable, UNIQUE) rather than bcrypt — bcrypt's per-call salt makes
 * lookup-by-hash impossible, and a fast hash is safe for high-entropy tokens.
 */
export function generateRefreshToken(): {
  token: string;
  hash: string;
  expiresAt: Date;
} {
  const token = randomBytes(32).toString('hex');
  return {
    token,
    hash: hashToken(token),
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL * 1000),
  };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
