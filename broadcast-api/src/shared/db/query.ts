// src/shared/db/query.ts
import type { PoolClient, QueryResultRow } from 'pg';
import { pool } from '../../config/database';

/** Neon's free-tier compute can suspend between BullMQ jobs (the worker
 * often sits idle for minutes between broadcasts); the pool's own
 * idleTimeoutMillis reduces this window but can't eliminate the race. A
 * connection that goes stale this way fails with a client-side transport
 * error, not a SQL error — safe to retry once against a fresh connection
 * rather than fail the whole job. */
function isStaleConnectionError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes('Connection terminated') ||
    message.includes('terminated unexpectedly') ||
    message.includes('Connection terminated due to connection timeout')
  );
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
    // A stale connection that dies on BEGIN never entered a real
    // transaction — ROLLBACK against it would just throw a second,
    // more confusing error and mask the original one.
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
