// src/config/redis.ts
import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

redis.on('connect', () => logger.info('redis connected'));
redis.on('error', (err) => logger.error({ err }, 'redis error'));

// BullMQ needs its own connection (maxRetriesPerRequest: null is required by BullMQ).
export const bullRedis = new Redis(env.BULLMQ_REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

bullRedis.on('connect', () => logger.info('bullmq redis connected'));
bullRedis.on('error', (err) => logger.error({ err }, 'bullmq redis error'));

export async function closeRedis(): Promise<void> {
  await redis.quit().catch(() => undefined);
  await bullRedis.quit().catch(() => undefined);
}
