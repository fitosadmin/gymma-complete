// migrations/run.ts
// Minimal forward-only migration runner. Applies *.sql in name order,
// tracks applied files in a `_migrations` table. Mirrors broadcast-api's
// migrations/run.ts.
import 'dotenv/config';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Detects the Neon-restart desync pattern: if _migrations says a file ran
 * but the physical table no longer exists (Neon free-tier can drop tables on
 * compute restart), we remove the stale tracking rows so they re-apply.
 */
async function clearDesyncedMigrations(client: import('pg').PoolClient): Promise<void> {
  const { rows } = await client.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN ('diet_plans')`,
  );
  const existingTables = new Set(rows.map((r) => r.table_name));

  const migrationsSuspect: string[] = [];
  if (!existingTables.has('diet_plans')) migrationsSuspect.push('001_diet_plans.sql');

  if (migrationsSuspect.length > 0) {
    console.warn(
      `⚠  Neon desync detected — physical tables missing but migration records exist. Clearing: ${migrationsSuspect.join(', ')}`,
    );
    for (const name of migrationsSuspect) {
      await client.query('DELETE FROM _migrations WHERE name = $1', [name]);
    }
  }
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name        TEXT PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Auto-heal the Neon desync before reading applied set
    await clearDesyncedMigrations(client);

    const dir = __dirname;
    const files = readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

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
    console.log('migrations done');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
