# Database Migration Desync Analysis & Fix

This document outlines the methodology used to diagnose and repair the missing `broadcasts` and `diet_plans` tables on the Neon PostgreSQL database.

## The Problem
The Render backend services (`broadcast-api` and `diet_suggestion`) were crashing on startup with `table not found` errors. However, running `npm run migrate` in those repositories resulted in `= skip 001_broadcasts.sql` or `= skip 001_diet_plans.sql`.

## Diagnostic Methodology

To diagnose this without relying on local CLI tools like `psql`, a direct connection to the live Neon database was established using a minimal Node.js script and the `pg` driver.

### 1. Verification of Actual Tables
First, the database was queried to check which tables physically existed in the `public` schema.

```javascript
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkTables() {
  const client = await pool.connect();
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  
  console.log("Tables in DB:");
  res.rows.forEach(r => console.log(r.table_name));
  
  await client.release();
  await pool.end();
}
```
**Result:** Core tables (e.g., `users`, `gyms`) were present, but the specific tables for the microservices (`broadcasts`, `diet_plans`) were completely missing.

### 2. Verification of Migration State
Next, the `_migrations` tracking table was queried to see what the migration system *thought* the state of the database was.

```javascript
async function checkMigrations() {
  const client = await pool.connect();
  const mig = await client.query("SELECT * FROM _migrations");
  
  console.log("Migrations run:");
  mig.rows.forEach(r => console.log(r.name));
}
```
**Result:** The `_migrations` table contained records for both `001_broadcasts.sql` and `001_diet_plans.sql`. 

### Diagnosis Conclusion
Because the tracking table retained the records but the physical tables were gone, the database had suffered a desync. This typically happens if tables are manually dropped, or if the database is restored from a partial snapshot that preserves the `_migrations` table but not the newer data tables. Because the tracking records existed, the `npm run migrate` script safely (but incorrectly) assumed the tables were already built and skipped them.

## The Fix

To resolve the desync, the false records were manually removed from the `_migrations` table using a targeted `DELETE` statement.

```javascript
async function fixDesync() {
  const client = await pool.connect();
  
  // Wipe the false migration records
  await client.query("DELETE FROM _migrations WHERE name = '001_broadcasts.sql'");
  await client.query("DELETE FROM _migrations WHERE name = '001_diet_plans.sql'");
  
  await client.release();
  await pool.end();
}
```

Once the false records were cleared, running `npm run migrate` in both the `broadcast-api` and `diet_suggestion` directories successfully applied the SQL files (`+ apply 001_broadcasts.sql`), correctly re-creating all missing tables.
