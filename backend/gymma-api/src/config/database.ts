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
    
    // Auto-migrate schema updates for member roles
    await client.query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'member'`).catch(() => {});
    await client.query(`ALTER TABLE users ALTER COLUMN email DROP NOT NULL`).catch(() => {});
    await client.query(`
      CREATE TABLE IF NOT EXISTS gym_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
        membership_plan_id UUID REFERENCES membership_plans(id) ON DELETE SET NULL,
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ,
        deleted_at TIMESTAMPTZ,
        UNIQUE(gym_id, user_id)
      )
    `).catch((err) => { logger.warn({ err }, "Could not auto-migrate gym_members table"); });

    logger.info('database ready (PostGIS present)');
  } finally {
    client.release();
  }
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
