// src/config/database.ts
import { Pool } from 'pg';
import { env, isProd } from './env';
import { logger } from './logger';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  // Neon's free-tier compute auto-suspends on inactivity; keeping this well
  // under Neon's suspend window makes the app proactively recycle idle
  // connections before Neon drops them out from under us (see
  // shared/db/query.ts's retry-on-stale-connection wrapper for the other
  // half of this mitigation).
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
  keepAlive: true,
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

    // ── Neon desync self-heal ───────────────────────────────────────────────
    // Neon free-tier can restart its compute and drop tables while leaving the
    // _migrations tracking table intact. Detect this and log a clear warning
    // so the operator knows to rerun migrate if core tables ever disappear.
    const coreTablesManaged = [
      'users', 'gyms', 'gym_members', 'owner_gym_links',
      'refresh_tokens', 'membership_plans', 'gym_classes', 'reviews',
    ];
    const { rows: existing } = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = ANY($1)`,
      [coreTablesManaged],
    );
    const existingSet = new Set(existing.map((r) => r.table_name));
    const missing = coreTablesManaged.filter((t) => !existingSet.has(t));
    if (missing.length > 0) {
      logger.warn({ missing }, 'gymma-api tables missing — clearing stale migration records (Neon desync). Run npm run migrate to recover.');
      // Clear stale migration records so npm run migrate will re-apply them
      await client.query(
        `DELETE FROM _migrations WHERE name IN ('001_initial_schema.sql', '002_add_members.sql')`,
      ).catch(() => { /* _migrations may not exist yet — safe to ignore */ });
    }

    // ── Inline schema patches (idempotent) ─────────────────────────────────
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
    `).catch((err) => { logger.warn({ err }, 'Could not auto-migrate gym_members table'); });

    logger.info('database ready (PostGIS present)');
  } finally {
    client.release();
  }
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
