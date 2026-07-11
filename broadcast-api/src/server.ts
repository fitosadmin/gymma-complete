// src/server.ts
// Boots the REST API (Express) and the real-time WebSocket server
// (Socket.io) on the SAME HTTP listener/port (`PORT`) — PaaS platforms like
// Render only forward external traffic to one port per web service, so a
// second listener on WS_PORT would be unreachable from outside the
// container. Socket.io multiplexes onto the Express server via its own
// `/ws/broadcasts` namespace/path instead.
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
  const io = createSocketServer(apiServer);
  apiServer.listen(env.PORT, () => {
    logger.info(`broadcast-api REST + websocket listening on :${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    setTimeout(() => process.exit(1), 10_000).unref(); // hard-exit guard
    await io.close();
    await new Promise<void>((resolve) => apiServer.close(() => resolve()));
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
