const { Pool } = require('pg');
const pool = new Pool({ connectionString: "postgresql://neondb_owner:npg_NRmg4Goc1UpH@ep-fragrant-lake-atbboxj6-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require" });
async function run() {
  const client = await pool.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS test_table (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid()
    );
  `);
  console.log("Created test_table");
  
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'test_table'");
  console.log("Found:", res.rows);
  
  await client.release();
  await pool.end();
}
run().catch(console.error);
