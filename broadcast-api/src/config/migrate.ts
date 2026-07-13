// src/config/migrate.ts
// Shared by both server.ts and worker.ts — Neon's free-tier compute can
// restart and drop tables while keeping the `_migrations` tracking table
// intact (a "desync": migrations look applied but the physical tables are
// gone). Running this on every boot for BOTH processes self-heals that
// automatically instead of crash-looping with "table not found" until
// someone manually clears the stale tracking row.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pool } from './database';
import { logger } from './logger';

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);

    // Auto-heal: 001_broadcasts.sql creates FOUR tables. If any one of them
    // is gone but the migration is still tracked as applied, the other
    // three surviving isn't enough — re-run it. (Checking only `broadcasts`
    // here missed desyncs where e.g. user_devices alone had vanished.)
    const managedTables = ['broadcasts', 'user_devices', 'broadcast_receipts', 'device_push_failures'];
    const { rows: existing } = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name = ANY($1)`,
      [managedTables],
    );
    const existingSet = new Set(existing.map((r) => r.table_name));
    const missing = managedTables.filter((t) => !existingSet.has(t));
    if (missing.length > 0) {
      logger.warn({ missing }, 'broadcast tables missing — clearing stale migration records (Neon desync)');
      await client.query(`DELETE FROM _migrations WHERE name = '001_broadcasts.sql'`);
    }

    const dir = join(__dirname, '..', '..', 'migrations');
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
      } catch (err: any) {
        await client.query('ROLLBACK');
        if (err.code === '23505') {
          // Unique violation: another process (e.g. worker.ts) already applied it
          logger.info(`= skip   ${file} (applied concurrently by another process)`);
          continue;
        }
        logger.error({ err }, `✗ failed ${file}`);
        throw err;
      }
    }
  } finally {
    client.release();
  }
}
