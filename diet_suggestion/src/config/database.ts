// src/config/database.ts
import { Pool } from 'pg';
import { env } from './env';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  // Neon's free-tier compute auto-suspends on inactivity; keeping this well
  // under Neon's suspend window makes the app proactively recycle idle
  // connections before Neon drops them out from under us (see
  // shared/db/query.ts's retry-on-stale-connection wrapper for the other
  // half of this mitigation).
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
  keepAlive: true,
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error', err);
});
