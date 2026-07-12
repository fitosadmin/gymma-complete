// src/shared/db/query.ts
import type { QueryResultRow } from 'pg';
import { pool } from '../../config/database';

/** Neon's free-tier compute auto-suspends on inactivity (this service spins
 * down on Render too, so idle stretches are routine); a pooled connection
 * that outlives that suspend fails with a client-side transport error on
 * its next use, not a SQL error — safe to retry once against a fresh
 * connection rather than fail the whole request. */
function isStaleConnectionError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes('Connection terminated') || message.includes('terminated unexpectedly');
}

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

export async function queryOne<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
