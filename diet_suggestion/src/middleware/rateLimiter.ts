// src/middleware/rateLimiter.ts
// Uses in-memory store (no Redis needed) — suitable for single-instance Render deployment.
import rateLimit from 'express-rate-limit';
import { failure } from '../shared/response/envelope';

function make(windowMs: number, max: number) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json(failure('RATE_LIMITED', 'Too many requests — please slow down.'));
    },
  });
}

/** Auth endpoints — 20 attempts per 15 min */
export const authLimiter = make(15 * 60 * 1000, 20);

/** Diet calculate — 10 calculations per 15 min */
export const dietLimiter = make(15 * 60 * 1000, 10);
