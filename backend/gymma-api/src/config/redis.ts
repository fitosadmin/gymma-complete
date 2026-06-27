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

export async function closeRedis(): Promise<void> {
  await redis.quit();
}
