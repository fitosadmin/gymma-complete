// tests/integration/helpers.ts
import { pool } from '../../src/config/database';
import { redis } from '../../src/config/redis';

/** True if a Postgres connection can be established quickly. */
export async function canConnectDb(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

export async function closeAll(): Promise<void> {
  await pool.end().catch(() => undefined);
  redis.disconnect(); // immediate; quit() hangs on a never-connected lazy client
}
