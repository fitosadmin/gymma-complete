// src/shared/auth/tokens.ts
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

/**
 * Access tokens are issued by the platform's main auth service (gymma-api).
 * This service only verifies them — it shares ACCESS_TOKEN_SECRET but does
 * not sign tokens of its own.
 */
export interface AccessPayload extends jwt.JwtPayload {
  sub: string;
  role: 'owner' | 'admin' | 'super_admin' | 'member';
  permissions?: string[];
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
  return decoded as AccessPayload;
}
