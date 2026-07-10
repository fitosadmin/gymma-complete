// src/broadcast/jobs/push-notification.worker.ts
// Consumes QUEUE_PUSH_NOTIFICATIONS: sends the actual FCM push for a broadcast.
import { Worker, type Job } from 'bullmq';
import { bullRedis } from '../../config/redis';
import { logger } from '../../config/logger';
import { QUEUE_PUSH_NOTIFICATIONS, type SendGymPushJobData } from './queues';
import { getBroadcastRow } from '../services/broadcast.service';
import { pushNotificationService } from '../services/push-notification.service';

async function processSendGymPush(job: Job<SendGymPushJobData>): Promise<void> {
  const { gymId, broadcastId } = job.data;

  const broadcast = await getBroadcastRow(broadcastId);
  if (!broadcast) {
    logger.warn({ broadcastId }, 'broadcast not found during push send, skipping');
    return;
  }

  const result = await pushNotificationService.sendToGym(gymId, broadcast);
  logger.info({ broadcastId, gymId, ...result }, 'push-notification job completed');
}

export function startPushNotificationWorker(): Worker<SendGymPushJobData> {
  const worker = new Worker<SendGymPushJobData>(
    QUEUE_PUSH_NOTIFICATIONS,
    async (job) => processSendGymPush(job),
    { connection: bullRedis, concurrency: 5 },
  );

  worker.on('error', (err) => logger.error({ err }, 'push-notification worker connection error'));

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, broadcastId: job.data.broadcastId }, 'push-notification job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, broadcastId: job?.data.broadcastId, err }, 'push-notification job failed');
  });

  return worker;
}
