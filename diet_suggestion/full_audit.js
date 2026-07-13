const { Pool } = require('pg');
const pool = new Pool({ connectionString: "postgresql://neondb_owner:npg_NRmg4Goc1UpH@ep-fragrant-lake-atbboxj6-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require" });
async function audit() {
  const client = await pool.connect();
  
  // All tables
  const tabs = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log("=== PHYSICAL TABLES ===");
  tabs.rows.forEach(r => console.log(r.table_name));
  
  // Migrations
  const migs = await client.query("SELECT name, applied_at FROM _migrations ORDER BY applied_at");
  console.log("\n=== MIGRATIONS TABLE ===");
  migs.rows.forEach(r => console.log(r.name, r.applied_at));

  // Check if this DB is being connected via pooler (pooler can't do DDL - causes issues)
  const db = await client.query("SELECT current_database(), current_user, pg_postmaster_start_time()");
  console.log("\n=== DB INFO ===");
  console.log(db.rows[0]);
  
  await client.release();
  await pool.end();
}
audit().catch(console.error);
