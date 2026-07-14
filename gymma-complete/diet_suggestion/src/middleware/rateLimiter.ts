// src/middleware/rateLimiter.ts
// Uses in-memory store (no Redis needed) — suitable for single-instance Render deployment.
import rateLimit from 'express-rate-limit';
import { failure } from '../shared/response/envelope';

function make(windowMs: number, max: number, keyGenerator?: (req: import('express').Request) => string) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    ...(keyGenerator ? { keyGenerator } : {}),
    handler: (_req, res) => {
      res.status(429).json(failure('RATE_LIMITED', 'Too many requests — please slow down.'));
    },
  });
}

/** Auth endpoints — 20 attempts per 15 min. Pre-auth (no req.user yet), so
 * this stays IP-keyed (express-rate-limit's default) — appropriate for
 * brute-force protection on login/register. */
export const authLimiter = make(15 * 60 * 1000, 20);

/** Diet calculate — 10 calculations per 15 min, keyed PER USER rather than
 * per IP. dietRouter applies requireAuth before this middleware, so req.user
 * is always populated here — without this, testers on the same WiFi/NAT
 * would all share one IP-bucket and lock each other out after ~10 total
 * requests combined, not 10 each. */
export const dietLimiter = make(15 * 60 * 1000, 10, (req) => req.user!.sub);
