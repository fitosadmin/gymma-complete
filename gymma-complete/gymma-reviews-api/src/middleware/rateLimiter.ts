// src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../config/redis';
import { failure } from '../shared/response/envelope';

interface LimitOptions {
  windowMs: number;
  max: number;
  prefix: string;
}

export function makeRateLimiter({ windowMs, max, prefix }: LimitOptions) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      prefix: `rl:${prefix}:`,
      sendCommand: (...args: string[]) =>
        redis.call(...(args as [string, ...string[]])) as Promise<any>,
    }),
    handler: (_req, res) => {
      res.status(429).json(failure('RATE_LIMITED', 'Too many requests, slow down.'));
    },
  });
}

// Shared limiters used across modules
export const inquiryLimiter = makeRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  prefix: 'inquiry',
});

export const demoRequestLimiter = makeRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 3,
  prefix: 'demo',
});

export const authLimiter = makeRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  prefix: 'auth',
});
