// src/shared/db/query.ts
import type { PoolClient, QueryResultRow } from 'pg';
import { pool } from '../../config/database';
import { logger } from '../../config/logger';

/** Neon's free-tier compute auto-suspends on inactivity (this service spins
 * down on Render too, so idle stretches are routine); a pooled connection
 * that outlives that suspend fails with a client-side transport error on
 * its next use, not a SQL error — safe to retry once against a fresh
 * connection rather than fail the whole request. */
function isStaleConnectionError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes('Connection terminated') || message.includes('terminated unexpectedly');
}

/** Detects Neon mid-session table disappearance (42P01 = undefined_table).
 * If a table vanishes while the process is running, trigger a clean restart
 * so runMigrations() on boot self-heals, rather than serving broken traffic. */
function isMissingTableError(err: unknown): boolean {
  return (err as any)?.code === '42P01';
}

/** Run a parameterized query and get typed rows back. */
export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  try {
    const res = await pool.query<T>(text, params as any[]);
    return res.rows;
  } catch (err) {
    // Mid-session Neon desync: a table vanished while we're running.
    // Crash cleanly so Render restarts and runMigrations() self-heals on boot.
    if (isMissingTableError(err)) {
      logger.error({ err }, 'relation missing mid-session (Neon desync) — restarting for self-heal');
      process.exit(1);
    }
    if (!isStaleConnectionError(err)) throw err;
    const res = await pool.query<T>(text, params as any[]);
    return res.rows;
  }
}

/** Run a query expecting exactly one row, or null. */
export async function queryOne<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

async function runTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    if (isMissingTableError(err)) {
      logger.error({ err }, 'relation missing mid-session in transaction (Neon desync) — restarting for self-heal');
      process.exit(1);
    }
    if (!isStaleConnectionError(err)) {
      await client.query('ROLLBACK').catch(() => undefined);
    }
    throw err;
  } finally {
    client.release();
  }
}

/** Run work inside a transaction. Rolls back on throw. Retries once,
 * against a fresh connection, if the failure was a stale pooled
 * connection rather than a real error from `fn`. */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  try {
    return await runTransaction(fn);
  } catch (err) {
    if (!isStaleConnectionError(err)) throw err;
    return runTransaction(fn);
  }
}
