const { Pool } = require('pg');
const pool = new Pool({ connectionString: "postgresql://neondb_owner:npg_NRmg4Goc1UpH@ep-fragrant-lake-atbboxj6-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require" });
async function audit() {
  const client = await pool.connect();
  const tabs = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('broadcasts','broadcast_receipts','user_devices','device_push_failures','diet_plans','users','gyms','gym_members') ORDER BY table_name");
  console.log("=== PHYSICAL TABLES ===");
  tabs.rows.forEach(r => console.log(" ✓", r.table_name));
  const tableNames = new Set(tabs.rows.map(r => r.table_name));
  ['broadcasts','broadcast_receipts','user_devices','diet_plans'].forEach(t => {
    if (!tableNames.has(t)) console.log(" ✗ MISSING:", t);
  });
  const migs = await client.query("SELECT name, applied_at FROM _migrations ORDER BY applied_at");
  console.log("\n=== MIGRATIONS ===");
  migs.rows.forEach(r => console.log(`  ${r.name} @ ${r.applied_at}`));
  if (tableNames.has('broadcasts')) {
    const bc = await client.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='sent') as sent, COUNT(*) FILTER (WHERE status='deleted') as deleted FROM broadcasts");
    console.log("\n=== BROADCASTS ===", bc.rows[0]);
    const recent = await client.query("SELECT id, gym_id, title, status, sent_at FROM broadcasts ORDER BY sent_at DESC LIMIT 5");
    console.log("Recent broadcasts:");
    recent.rows.forEach(r => console.log("  ["+r.id.slice(0,8)+"]", r.status, '"'+r.title?.slice(0,30)+'"', r.sent_at));
  }
  if (tableNames.has('broadcast_receipts')) {
    const rc = await client.query("SELECT COUNT(*) as total FROM broadcast_receipts");
    console.log("\n=== RECEIPTS ===", rc.rows[0]);
  }
  const uc = await client.query("SELECT COUNT(*) as total, role FROM users GROUP BY role");
  console.log("\n=== USERS BY ROLE ===");
  uc.rows.forEach(r => console.log(" ", r.role, ":", r.total));
  await client.release();
  await pool.end();
}
audit().catch(e => { console.error("ERROR:", e.message, e.stack); process.exit(1); });
