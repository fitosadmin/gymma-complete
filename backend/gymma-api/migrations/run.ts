// migrations/run.ts
// Minimal forward-only migration runner. Applies *.sql in name order,
// tracks applied files in a `_migrations` table.
// Self-heals the Neon desync pattern: if _migrations says a file ran but
// the physical tables are missing (Neon free-tier compute restart), the
// stale tracking rows are cleared and the SQL is re-applied.
import 'dotenv/config';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name        TEXT PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // ── Neon desync self-heal ─────────────────────────────────────────────
    // If _migrations has a record but the physical table is gone, clear the
    // stale record so it re-applies below.
    const coreTables = ['users', 'gyms', 'gym_members', 'owner_gym_links', 'refresh_tokens'];
    const { rows: existing } = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = ANY($1)`,
      [coreTables],
    );
    const existingSet = new Set(existing.map((r) => r.table_name));
    const missing = coreTables.filter((t) => !existingSet.has(t));
    if (missing.length > 0) {
      console.warn(`⚠  Neon desync detected — tables missing: ${missing.join(', ')}. Clearing stale migration records.`);
      await client.query(
        `DELETE FROM _migrations WHERE name IN ('001_initial_schema.sql', '002_add_members.sql')`,
      );
    }

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
