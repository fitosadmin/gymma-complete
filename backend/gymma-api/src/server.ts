// src/server.ts
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { assertDatabaseReady, closeDatabase } from './config/database';
import { closeRedis } from './config/redis';

async function bootstrap() {
  await assertDatabaseReady();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`gymma-api listening on :${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
      await closeDatabase().catch(() => undefined);
      await closeRedis().catch(() => undefined);
      logger.info('shutdown complete');
      process.exit(0);
    });
    // hard-exit guard
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error({ err }, 'failed to start server');
  process.exit(1);
});
