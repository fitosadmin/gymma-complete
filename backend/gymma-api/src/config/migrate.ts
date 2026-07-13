// src/config/migrate.ts
// Self-healing migration runner for gymma-api.
// Called on every boot from server.ts — auto-detects the Neon free-tier
// desync pattern (tables vanish after a compute restart while _migrations
// tracking table survives) and re-applies missing SQL files automatically,
// so the service never starts up in a "looks healthy but broken" state.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pool } from './database';
import { logger } from './logger';

// Tables created by 001_initial_schema.sql whose absence signals a desync.
const SCHEMA_001_TABLES = ['gyms', 'users', 'owner_gym_links', 'refresh_tokens', 'membership_plans'];
// Tables created by 002_add_members.sql
const SCHEMA_002_TABLES = ['gym_members'];

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    // Ensure the tracking table exists before any other query.
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name        TEXT PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // ── Neon desync self-heal ─────────────────────────────────────────────
    // Check which managed tables actually exist in the database right now.
    const allManaged = [...SCHEMA_001_TABLES, ...SCHEMA_002_TABLES];
    const { rows: existing } = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = ANY($1)`,
      [allManaged],
    );
    const existingSet = new Set(existing.map((r) => r.table_name));

    // If any 001 table is missing, force a re-run of 001_initial_schema.sql
    const missing001 = SCHEMA_001_TABLES.filter((t) => !existingSet.has(t));
    if (missing001.length > 0) {
      logger.warn({ missing: missing001 }, 'gymma-api core tables missing — clearing stale migration record (Neon desync)');
      await client.query(`DELETE FROM _migrations WHERE name = '001_initial_schema.sql'`);
    }

    // If any 002 table is missing, force a re-run of 002_add_members.sql
    const missing002 = SCHEMA_002_TABLES.filter((t) => !existingSet.has(t));
    if (missing002.length > 0) {
      logger.warn({ missing: missing002 }, 'gymma-api member tables missing — clearing stale migration record (Neon desync)');
      await client.query(`DELETE FROM _migrations WHERE name IN ('002_add_members.sql', '002_create_materialized_view.sql')`);
    }

    // ── Apply pending migrations ──────────────────────────────────────────
    const dir = join(__dirname, '..', '..', 'migrations');
    const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
    const { rows: applied } = await client.query<{ name: string }>('SELECT name FROM _migrations');
    const appliedSet = new Set(applied.map((r) => r.name));

    for (const file of files) {
      if (appliedSet.has(file)) {
        logger.info(`= skip   ${file}`);
        continue;
      }
      const sql = readFileSync(join(dir, file), 'utf8');
      logger.info(`+ apply  ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations(name) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (err: any) {
        await client.query('ROLLBACK');
        if (err.code === '23505') {
          // Unique violation: another process already applied it
          logger.info(`= skip   ${file} (applied concurrently by another process)`);
          continue;
        }
        logger.error({ err }, `✗ failed  ${file}`);
        throw err;
      }
    }

    logger.info('gymma-api migrations done');
  } finally {
    client.release();
  }
}
