// src/server.ts
import app from './app';
import { env } from './config/env';
import { pool } from './config/database';

async function start() {
  // Verify DB connectivity before accepting traffic
  try {
    await pool.query('SELECT 1');
    console.log('✅  Database connected');
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
    server.close(async () => {
      await pool.end();
      console.log('✅  DB pool closed. Bye!');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

start();
