const { Pool } = require('pg');
const pool = new Pool({ connectionString: "postgresql://neondb_owner:npg_NRmg4Goc1UpH@ep-fragrant-lake-atbboxj6-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require" });

async function fix() {
  const client = await pool.connect();
  await client.query("DELETE FROM _migrations WHERE name = '001_broadcasts.sql'");
  console.log("Deleted 001_broadcasts.sql from _migrations");
  
  await client.release();
  await pool.end();
}
fix().catch(console.error);
