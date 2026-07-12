// src/config/migrate.ts
// Shared by server.ts (runs on every boot) and shared/db/query.ts (runs
// mid-session on a live desync) and migrations/run.ts (CLI entry point) —
// one implementation so they can't drift apart. Neon's free-tier compute
// can drop a physical table while `_migrations` still tracks it as applied
// (root cause unconfirmed, observed live more than once); this detects that
// and clears the stale tracking row so the migration re-applies.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pool } from './database';

const MANAGED_TABLES: Record<string, string> = {
  diet_plans: '001_diet_plans.sql',
};

async function clearDesyncedMigrations(client: import('pg').PoolClient): Promise<void> {
  const { rows } = await client.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = ANY($1)`,
    [Object.keys(MANAGED_TABLES)],
  );
  const existingTables = new Set(rows.map((r) => r.table_name));

  const suspect = Object.entries(MANAGED_TABLES)
    .filter(([table]) => !existingTables.has(table))
    .map(([, migrationFile]) => migrationFile);

  if (suspect.length > 0) {
    console.warn(`Neon desync detected — physical tables missing but migration records exist. Clearing: ${suspect.join(', ')}`);
    for (const name of suspect) {
      await client.query('DELETE FROM _migrations WHERE name = $1', [name]);
    }
  }
}

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name        TEXT PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await clearDesyncedMigrations(client);

    const dir = join(__dirname, '..', '..', 'migrations');
    const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
    const { rows } = await client.query<{ name: string }>('SELECT name FROM _migrations');
    const applied = new Set(rows.map((r) => r.name));

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`= skip   ${file}`);
        continue;
      }
      const sql = readFileSync(join(dir, file), 'utf8');
      console.log(`+ apply  ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations(name) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`✗ failed ${file}`);
        throw err;
      }
    }
  } finally {
    client.release();
  }
}
