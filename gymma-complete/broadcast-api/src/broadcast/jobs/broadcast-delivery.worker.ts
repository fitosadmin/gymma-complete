// src/broadcast/jobs/broadcast-delivery.worker.ts
// Consumes QUEUE_BROADCAST_DELIVERY: fans a newly-created broadcast out to
// per-member receipt rows (batched), then hands off to the push queue.
import { Worker, type Job } from 'bullmq';
import { bullRedis } from '../../config/redis';
import { logger } from '../../config/logger';
import { QUEUE_BROADCAST_DELIVERY, type BroadcastCreatedJobData, enqueueGymPush } from './queues';
import {
  getBroadcastRow,
  getActiveGymMemberIds,
  batchInsertReceipts,
  setBroadcastStatus,
} from '../services/broadcast.service';

async function processBroadcastCreated(job: Job<BroadcastCreatedJobData>): Promise<void> {
  const { broadcastId, gymId } = job.data;

  const broadcast = await getBroadcastRow(broadcastId);
  if (!broadcast) {
    logger.warn({ broadcastId }, 'broadcast not found during delivery, skipping');
    return;
  }

  const memberIds = await getActiveGymMemberIds(gymId);
  const inserted = await batchInsertReceipts(broadcastId, gymId, memberIds);

  logger.info(
    { broadcastId, gymId, memberCount: memberIds.length, receiptsInserted: inserted },
    'broadcast receipts fanned out',
  );

  await enqueueGymPush({ gymId, broadcastId });
}

export function startBroadcastDeliveryWorker(): Worker<BroadcastCreatedJobData> {
  const worker = new Worker<BroadcastCreatedJobData>(
    QUEUE_BROADCAST_DELIVERY,
    async (job) => processBroadcastCreated(job),
    { connection: bullRedis, concurrency: 5 },
  );

  worker.on('error', (err) => logger.error({ err }, 'broadcast-delivery worker connection error'));

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, broadcastId: job.data.broadcastId }, 'broadcast-delivery job completed');
  });

  worker.on('failed', async (job, err) => {
    if (!job) return;
    logger.error({ jobId: job.id, broadcastId: job.data.broadcastId, err, attemptsMade: job.attemptsMade }, 'broadcast-delivery job failed');

    const attempts = job.opts.attempts ?? 1;
    if (job.attemptsMade >= attempts) {
      await setBroadcastStatus(job.data.broadcastId, 'failed').catch((markErr) => {
        logger.error({ markErr, broadcastId: job.data.broadcastId }, 'failed to mark broadcast as failed after exhausted retries');
      });
    }
  });

  return worker;
}
