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

/** Verifies the connection and that the broadcast tables exist. Call on boot. */
export async function assertDatabaseReady(): Promise<void> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables WHERE table_name = 'broadcasts'
       ) AS exists`,
    );
    if (!rows[0]?.exists) {
      throw new Error('broadcasts table not found. Run `npm run migrate` first.');
    }
    logger.info('database ready (broadcast schema present)');
  } finally {
    client.release();
  }
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
