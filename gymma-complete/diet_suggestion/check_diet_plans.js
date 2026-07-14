// Diagnostic only — read-only queries, no writes. Mirrors the methodology
// in database_verification.md, scoped to diet_plans specifically since it's
// still failing with "relation does not exist" after that fix was applied
// to broadcasts.
//
// Run from Render's Shell tab on diet_suggestion (DATABASE_URL already in
// env there), or locally with DATABASE_URL set:
//   node check_diet_plans.js
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    console.log('=== Tables in public schema ===');
    const tables = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
    );
    tables.rows.forEach((r) => console.log(r.table_name));

    console.log('\n=== _migrations table contents ===');
    const mig = await client.query('SELECT name, applied_at FROM _migrations ORDER BY applied_at');
    mig.rows.forEach((r) => console.log(`${r.name}  (applied ${r.applied_at})`));

    console.log('\n=== Does diet_plans physically exist? ===');
    const exists = await client.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='diet_plans')",
    );
    console.log(exists.rows[0].exists);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('diagnostic failed:', err);
  process.exit(1);
});
