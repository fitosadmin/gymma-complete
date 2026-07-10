// src/shared/utils/metrics.ts
// Lightweight counters/gauges backed by Redis so they're shared across the
// API process and worker process. Not a replacement for real observability
// tooling (Prometheus etc.) — just enough to satisfy basic alerting.
import { redis } from '../../config/redis';
import { logger } from '../../config/logger';

const KEY_PREFIX = 'metrics:';

export async function incrCounter(name: string, by = 1): Promise<void> {
  await redis.incrby(`${KEY_PREFIX}${name}`, by).catch((err) => {
    logger.warn({ err, name }, 'failed to increment metric counter');
  });
}

export async function setGauge(name: string, value: number): Promise<void> {
  await redis.set(`${KEY_PREFIX}${name}`, value).catch((err) => {
    logger.warn({ err, name }, 'failed to set metric gauge');
  });
}

export async function getCounter(name: string): Promise<number> {
  const v = await redis.get(`${KEY_PREFIX}${name}`);
  return v ? Number(v) : 0;
}

/** Records a push batch result and warns if the rolling failure rate crosses 5%. */
export async function recordPushResult(successCount: number, failureCount: number): Promise<void> {
  await incrCounter('push_notification_success_total', successCount);
  await incrCounter('push_notification_failure_total', failureCount);

  const [successTotal, failureTotal] = await Promise.all([
    getCounter('push_notification_success_total'),
    getCounter('push_notification_failure_total'),
  ]);
  const total = successTotal + failureTotal;
  if (total >= 20) {
    const failureRate = failureTotal / total;
    if (failureRate > 0.05) {
      logger.warn({ failureRate, successTotal, failureTotal }, 'push notification failure rate above 5% threshold');
    }
  }
}

export async function recordBroadcastLatency(ms: number): Promise<void> {
  if (ms > 2000) {
    logger.warn({ ms }, 'broadcast creation latency above 2s threshold');
  }
}
