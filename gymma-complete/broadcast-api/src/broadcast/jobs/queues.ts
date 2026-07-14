// src/broadcast/jobs/queues.ts
// Central BullMQ queue definitions, shared between producers (the API
// process, via broadcast.service.ts) and consumers (worker.ts).
import { Queue } from 'bullmq';
import { bullRedis } from '../../config/redis';
import { logger } from '../../config/logger';

export const QUEUE_BROADCAST_DELIVERY = 'broadcast-delivery';
export const QUEUE_PUSH_NOTIFICATIONS = 'push-notifications';
export const QUEUE_CLEANUP_JOBS = 'cleanup-jobs';

export interface BroadcastCreatedJobData {
  broadcastId: string;
  gymId: string;
}

export interface SendGymPushJobData {
  gymId: string;
  broadcastId: string;
}

export const broadcastDeliveryQueue = new Queue<BroadcastCreatedJobData>(
  QUEUE_BROADCAST_DELIVERY,
  { connection: bullRedis },
);

export const pushNotificationQueue = new Queue<SendGymPushJobData>(
  QUEUE_PUSH_NOTIFICATIONS,
  { connection: bullRedis },
);

export const cleanupQueue = new Queue(QUEUE_CLEANUP_JOBS, { connection: bullRedis });

// Without a listener, an 'error' event on any of these (e.g. a Redis blip)
// is an unhandled EventEmitter error and crashes the whole process — BullMQ
// already retries internally, we just need to not let it go unhandled.
for (const q of [broadcastDeliveryQueue, pushNotificationQueue, cleanupQueue]) {
  q.on('error', (err) => logger.error({ err, queue: q.name }, 'bullmq queue connection error'));
}

export async function enqueueBroadcastCreated(data: BroadcastCreatedJobData): Promise<void> {
  await broadcastDeliveryQueue.add('broadcast-created', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  });
}

export async function enqueueGymPush(data: SendGymPushJobData): Promise<void> {
  await pushNotificationQueue.add('send-gym-push', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  });
}

export async function closeQueues(): Promise<void> {
  await Promise.all([
    broadcastDeliveryQueue.close(),
    pushNotificationQueue.close(),
    cleanupQueue.close(),
  ]);
}
