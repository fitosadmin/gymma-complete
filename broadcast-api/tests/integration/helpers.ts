// tests/integration/helpers.ts
import jwt from 'jsonwebtoken';
import { pool } from '../../src/config/database';
import { redis, bullRedis } from '../../src/config/redis';
import { closeQueues } from '../../src/broadcast/jobs/queues';

/** True if a Postgres connection can be established quickly. */
export async function canConnectDb(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

/** True if Redis (rate limiting / BullMQ) is reachable. */
export async function canConnectRedis(): Promise<boolean> {
  try {
    await redis.connect();
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}

export async function closeAll(): Promise<void> {
  await pool.end().catch(() => undefined);
  await closeQueues().catch(() => undefined);
  redis.disconnect();
  bullRedis.disconnect();
}

interface TokenOptions {
  sub: string;
  role?: 'owner' | 'admin' | 'super_admin' | 'member';
  permissions?: string[];
}

export function mintAccessToken({ sub, role = 'member', permissions = [] }: TokenOptions): string {
  return jwt.sign({ sub, role, permissions }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: 900 });
}
