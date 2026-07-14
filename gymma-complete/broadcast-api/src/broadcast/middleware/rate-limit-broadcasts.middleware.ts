// src/broadcast/middleware/rate-limit-broadcasts.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import { redis } from '../../config/redis';
import { failure } from '../../shared/response/envelope';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

const WINDOW_SECONDS = 60 * 60; // 1 hour

/** Fixed-window limiter: `10 broadcasts/hour per sender`, key `rate_limit:broadcasts:{senderId}`. */
export async function rateLimitBroadcasts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const senderId = req.user?.id;
  if (!senderId) {
    next();
    return;
  }

  const key = `rate_limit:broadcasts:${senderId}`;
  const limit = env.API_RATE_LIMIT_BROADCASTS_PER_HOUR;

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }

    if (count > limit) {
      const retryAfter = await redis.ttl(key);
      logger.warn({ senderId, count, limit }, 'broadcast rate limit exceeded');
      res
        .status(429)
        .json(
          failure(
            'RATE_LIMIT_EXCEEDED',
            `You can only send ${limit} broadcasts per hour`,
            { retry_after: retryAfter > 0 ? retryAfter : WINDOW_SECONDS },
          ),
        );
      return;
    }

    next();
  } catch (err) {
    // Redis being down shouldn't take the broadcast endpoint offline entirely,
    // but we do want visibility into it.
    logger.error({ err, senderId }, 'rate limiter check failed, allowing request through');
    next();
  }
}
