// src/broadcast/jobs/cleanup.worker.ts
// Consumes QUEUE_CLEANUP_JOBS: daily maintenance of the user_devices table.
import { Worker, type Job } from 'bullmq';
import { bullRedis } from '../../config/redis';
import { logger } from '../../config/logger';
import { query } from '../../shared/db/query';
import { QUEUE_CLEANUP_JOBS, cleanupQueue } from './queues';

const DAILY_CRON = '0 3 * * *'; // 03:00 every day
const INACTIVE_DAYS = 90;
const MAX_CONSECUTIVE_FAILURES = 5;

async function processCleanupDevices(): Promise<void> {
  const deleted = await query<{ id: string }>(
    `DELETE FROM user_devices
      WHERE last_used_at < NOW() - INTERVAL '${INACTIVE_DAYS} days'
      RETURNING id`,
  );

  const deactivated = await query<{ id: string }>(
    `UPDATE user_devices ud
        SET is_active = FALSE
       FROM device_push_failures f
      WHERE f.fcm_token = ud.fcm_token
        AND f.consecutive_failures > $1
        AND ud.is_active = TRUE
      RETURNING ud.id`,
    [MAX_CONSECUTIVE_FAILURES],
  );

  logger.info(
    { deletedCount: deleted.length, deactivatedCount: deactivated.length },
    'cleanup-devices job completed',
  );
}

async function processCleanupJob(job: Job): Promise<void> {
  if (job.name === 'cleanup-devices') {
    await processCleanupDevices();
    return;
  }
  logger.warn({ jobName: job.name }, 'unknown cleanup job name, skipping');
}

export function startCleanupWorker(): Worker {
  const worker = new Worker(QUEUE_CLEANUP_JOBS, async (job) => processCleanupJob(job), {
    connection: bullRedis,
    concurrency: 1,
  });

  worker.on('error', (err) => logger.error({ err }, 'cleanup worker connection error'));

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'cleanup job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'cleanup job failed');
  });

  return worker;
}

/** Registers the recurring daily cleanup job. Idempotent — BullMQ dedupes by repeat key. */
export async function scheduleCleanupCron(): Promise<void> {
  await cleanupQueue.add(
    'cleanup-devices',
    {},
    {
      repeat: { pattern: DAILY_CRON },
      jobId: 'cleanup-devices-daily',
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    },
  );
  logger.info({ cron: DAILY_CRON }, 'cleanup-devices cron scheduled');
}
