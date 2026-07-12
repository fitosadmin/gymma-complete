// src/server.ts
// Boots the REST API (Express) and the real-time WebSocket server
// (Socket.io) on the SAME HTTP listener/port (`PORT`) — PaaS platforms like
// Render only forward external traffic to one port per web service, so a
// second listener on WS_PORT would be unreachable from outside the
// container. Socket.io multiplexes onto the Express server via its own
// `/ws/broadcasts` namespace/path instead.
import { createServer } from 'node:http';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createApp } from './app';
import { createSocketServer } from './websocket/socket-server';
import { env } from './config/env';
import { logger } from './config/logger';
import { pool, closeDatabase } from './config/database';
import { closeRedis } from './config/redis';

async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);

    // Auto-heal: if broadcasts table is gone but tracking record exists, clear it
    const { rows: existing } = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('broadcasts','user_devices','broadcast_receipts','device_push_failures')`,
    );
    if (!existing.some((r) => r.table_name === 'broadcasts')) {
      logger.warn('broadcasts table missing — clearing stale migration records (Neon desync)');
      await client.query(`DELETE FROM _migrations WHERE name = '001_broadcasts.sql'`);
    }

    const dir = join(__dirname, '..', 'migrations');
    const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
    const { rows: applied } = await client.query<{ name: string }>('SELECT name FROM _migrations');
    const appliedSet = new Set(applied.map((r) => r.name));

    for (const file of files) {
      if (appliedSet.has(file)) { logger.info(`= skip   ${file}`); continue; }
      const sql = readFileSync(join(dir, file), 'utf8');
      logger.info(`+ apply  ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations(name) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error({ err }, `✗ failed ${file}`);
        throw err;
      }
    }
  } finally {
    client.release();
  }
}

async function bootstrap() {
  // Run migrations on every boot — self-heals after Neon compute restarts
  logger.info('running migrations…');
  await runMigrations();
  logger.info('migrations done');

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

  // Last-resort safety net for anything outside asyncHandler's reach.
  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'uncaughtException — exiting');
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'unhandledRejection — exiting');
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, 'failed to start server');
  process.exit(1);
});
