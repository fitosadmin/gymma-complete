// src/middleware/auth.ts
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { failure } from '../shared/response/envelope';

export interface JwtPayload {
  sub: string;
  role: 'member' | 'owner' | 'admin' | 'super_admin';
  iat?: number;
  exp?: number;
}

// Extend Express Request so downstream handlers have req.user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json(failure('UNAUTHORIZED', 'Missing or invalid Authorization header'));
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json(failure('UNAUTHORIZED', 'Token is invalid or has expired'));
  }
}
