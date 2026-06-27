// src/config/database.ts
import { Pool } from 'pg';
import { env, isProd } from './env';
import { logger } from './logger';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: isProd ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  logger.error({ err }, 'unexpected idle pg client error');
});

/** Verifies the connection and that PostGIS is installed. Call on boot. */
export async function assertDatabaseReady(): Promise<void> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') AS exists`,
    );
    if (!rows[0]?.exists) {
      throw new Error('PostGIS extension is not installed. Run migration 001.');
    }
    logger.info('database ready (PostGIS present)');
  } finally {
    client.release();
  }
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
