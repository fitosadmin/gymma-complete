const { Pool } = require('pg');
const pool = new Pool({ connectionString: "postgresql://neondb_owner:npg_NRmg4Goc1UpH@ep-fragrant-lake-atbboxj6-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require" });

async function check() {
  const client = await pool.connect();
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log("Tables in DB:");
  res.rows.forEach(r => console.log(r.table_name));
  
  const mig = await client.query("SELECT * FROM _migrations");
  console.log("\nMigrations run:");
  mig.rows.forEach(r => console.log(r.name));
  
  await client.release();
  await pool.end();
}
check().catch(console.error);
