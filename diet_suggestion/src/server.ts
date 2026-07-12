// src/server.ts
import app from './app';
import { env } from './config/env';
import { pool } from './config/database';
import { runMigrations } from './config/migrate';

async function start() {
  // Run migrations on every boot — self-heals if a physical table went
  // missing while _migrations still thinks it's applied (observed live,
  // root cause unconfirmed). Also verifies basic DB connectivity.
  try {
    console.log('running migrations…');
    await runMigrations();
    console.log('✅  Database connected, migrations done');
  } catch (err) {
    console.error('❌  Database connection failed:', err);
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    console.log(`🚀  diet-suggestion API running on port ${env.PORT} [${env.NODE_ENV}]`);
    console.log(`    Health: http://localhost:${env.PORT}/api/v1/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — shutting down gracefully…`);
    setTimeout(() => process.exit(1), 10_000).unref(); // hard-exit guard
    server.close(async () => {
      await pool.end();
      console.log('✅  DB pool closed. Bye!');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  // Last-resort safety net — every route goes through asyncHandler, so this
  // shouldn't fire in practice, but an uncaught error would otherwise
  // silently crash the process (and every in-flight request for every user)
  // with no log line explaining why.
  process.on('uncaughtException', (err) => {
    console.error('uncaughtException — exiting', err);
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('unhandledRejection — exiting', reason);
    process.exit(1);
  });
}

start();
