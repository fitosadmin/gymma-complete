// src/server.ts
// Boots the REST API (Express) and the real-time WebSocket server
// (Socket.io) as two separate HTTP listeners — PORT for REST, WS_PORT for
// `/ws/broadcasts` — so they can be scaled or deployed independently.
import { createServer } from 'node:http';
import { createApp } from './app';
import { createSocketServer } from './websocket/socket-server';
import { env } from './config/env';
import { logger } from './config/logger';
import { assertDatabaseReady, closeDatabase } from './config/database';
import { closeRedis } from './config/redis';

async function bootstrap() {
  await assertDatabaseReady();

  const app = createApp();
  const apiServer = createServer(app);
  apiServer.listen(env.PORT, () => {
    logger.info(`broadcast-api REST listening on :${env.PORT} (${env.NODE_ENV})`);
  });

  const wsHttpServer = createServer();
  const io = createSocketServer(wsHttpServer);
  wsHttpServer.listen(env.WS_PORT, () => {
    logger.info(`broadcast-api websocket listening on :${env.WS_PORT} (/ws/broadcasts)`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    setTimeout(() => process.exit(1), 10_000).unref(); // hard-exit guard
    await new Promise<void>((resolve) => apiServer.close(() => resolve()));
    await io.close();
    await closeDatabase().catch(() => undefined);
    await closeRedis().catch(() => undefined);
    logger.info('shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error({ err }, 'failed to start server');
  process.exit(1);
});
