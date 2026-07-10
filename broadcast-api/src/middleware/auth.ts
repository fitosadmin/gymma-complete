// src/middleware/auth.ts
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError';
import { verifyAccessToken, type AccessPayload } from '../shared/auth/tokens';

export interface AuthUser {
  id: string;
  role: AccessPayload['role'];
  permissions: string[];
}

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

/** Verifies the JWT from `Authorization: Bearer <token>` and attaches req.user. 401 on failure. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (!token) {
    next(AppError.unauthorized('Missing access token'));
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, permissions: payload.permissions ?? [] };
    next();
  } catch {
    next(AppError.unauthorized('Invalid or expired access token'));
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
