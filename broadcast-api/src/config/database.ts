// src/config/database.ts
import { Pool } from 'pg';
import { env, isProd } from './env';
import { logger } from './logger';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  // Neon's free-tier compute auto-suspends on inactivity; a pooled
  // connection that outlives that suspend fails with "Connection
  // terminated unexpectedly" on its next use. Keeping this well under
  // Neon's suspend window makes the app proactively recycle connections
  // before Neon has a chance to drop them out from under us.
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
  keepAlive: true,
  ssl: isProd ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  logger.error({ err }, 'unexpected idle pg client error');
});

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
