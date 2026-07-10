// src/worker.ts
// Separate process from server.ts: runs the BullMQ workers that do the
// heavy lifting (receipt fan-out, push sends, device cleanup) off the
// request path. Deploy/scale independently from the API/WS processes.
import { createServer } from 'node:http';
import { logger } from './config/logger';
import { assertDatabaseReady, closeDatabase } from './config/database';
import { closeRedis } from './config/redis';
import { startBroadcastDeliveryWorker } from './broadcast/jobs/broadcast-delivery.worker';
import { startPushNotificationWorker } from './broadcast/jobs/push-notification.worker';
import { startCleanupWorker, scheduleCleanupCron } from './broadcast/jobs/cleanup.worker';
import { closeQueues } from './broadcast/jobs/queues';

async function bootstrap() {
  await assertDatabaseReady();

  const broadcastDeliveryWorker = startBroadcastDeliveryWorker();
  const pushNotificationWorker = startPushNotificationWorker();
  const cleanupWorker = startCleanupWorker();
  await scheduleCleanupCron();

  logger.info('broadcast-api workers started (broadcast-delivery, push-notifications, cleanup-jobs)');

  // This process does no HTTP work of its own — BullMQ workers just poll
  // Redis in the background. Platforms that host it as a "service" rather
  // than a bare process (e.g. Cloud Run, which health-checks $PORT and
  // refuses to deploy a container that never listens) need something to
  // connect to, so this is a liveness endpoint only, not a real API.
  const port = process.env.PORT ?? '8080';
  const healthServer = createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
  });
  healthServer.listen(Number(port), () => {
    logger.info(`worker health endpoint listening on :${port}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down workers`);
    setTimeout(() => process.exit(1), 10_000).unref();
    await new Promise<void>((resolve) => healthServer.close(() => resolve()));
    await Promise.all([
      broadcastDeliveryWorker.close(),
      pushNotificationWorker.close(),
      cleanupWorker.close(),
    ]);
    await closeQueues().catch(() => undefined);
    await closeDatabase().catch(() => undefined);
    await closeRedis().catch(() => undefined);
    logger.info('worker shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error({ err }, 'failed to start workers');
  process.exit(1);
});
