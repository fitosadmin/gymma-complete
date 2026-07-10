// migrations/run.ts
// Minimal forward-only migration runner. Applies *.sql in name order,
// tracks applied files in a `_migrations` table.
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
