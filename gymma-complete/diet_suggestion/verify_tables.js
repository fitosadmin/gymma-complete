// Check with DIRECT connection (not pooler) - different port/behavior
const { Pool } = require('pg');
// Pooler URL (what we used before): ep-fragrant-lake-atbboxj6-pooler.c-9.us-east-1.aws.neon.tech
// Direct URL: ep-fragrant-lake-atbboxj6.c-9.us-east-1.aws.neon.tech (no -pooler, different port 5432)
const directUrl = "postgresql://neondb_owner:npg_NRmg4Goc1UpH@ep-fragrant-lake-atbboxj6.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require";
const poolerUrl = "postgresql://neondb_owner:npg_NRmg4Goc1UpH@ep-fragrant-lake-atbboxj6-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function check(url, name) {
  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('broadcasts', 'diet_plans') ORDER BY table_name");
  console.log(`\n=== ${name} ===`);
  if (res.rows.length === 0) console.log("TABLES MISSING!");
  else res.rows.forEach(r => console.log("EXISTS:", r.table_name));
  await client.release();
  await pool.end();
}

async function main() {
  await check(poolerUrl, "POOLER CONNECTION");
  await check(directUrl, "DIRECT CONNECTION").catch(e => console.log("Direct connection failed:", e.message));
}
main().catch(console.error);
