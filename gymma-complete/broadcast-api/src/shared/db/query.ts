// src/shared/db/query.ts
import type { PoolClient, QueryResultRow } from 'pg';
import { pool } from '../../config/database';
import { runMigrations } from '../../config/migrate';
import { logger } from '../../config/logger';

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

/** Postgres 42P01 = undefined_table. We've seen this recur live (not just
 * on boot) — the `_migrations` tracking table stays intact while the
 * physical table it tracks disappears, root cause unconfirmed. runMigrations
 * already self-heals this on process boot; this catches it mid-session too
 * so a live desync never surfaces as a user-facing 500. */
function isMissingTableError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '42P01';
}

/** Concurrent requests that all hit the same missing-table error should
 * coalesce into a single migration run rather than racing each other. */
let healInFlight: Promise<void> | null = null;
function healSchema(): Promise<void> {
  if (!healInFlight) {
    logger.warn('relation does not exist mid-session — re-running migrations to self-heal');
    healInFlight = runMigrations().finally(() => {
      healInFlight = null;
    });
  }
  return healInFlight;
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
    if (isMissingTableError(err)) {
      await healSchema();
    } else if (!isStaleConnectionError(err)) {
      throw err;
    }
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
    // A stale/missing-table failure never entered a real transaction —
    // ROLLBACK against it would just throw a second, more confusing error
    // and mask the original one.
    if (!isStaleConnectionError(err) && !isMissingTableError(err)) {
      await client.query('ROLLBACK').catch(() => undefined);
    }
    throw err;
  } finally {
    client.release();
  }
}

/** Run work inside a transaction. Rolls back on throw. Retries once,
 * against a fresh connection (and after self-healing if the table itself
 * was missing), if the failure wasn't a real error from `fn`. */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  try {
    return await runTransaction(fn);
  } catch (err) {
    if (isMissingTableError(err)) {
      await healSchema();
    } else if (!isStaleConnectionError(err)) {
      throw err;
    }
    return runTransaction(fn);
  }
}
