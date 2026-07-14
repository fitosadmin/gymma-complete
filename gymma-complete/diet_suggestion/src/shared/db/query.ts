// src/shared/db/query.ts
import type { QueryResultRow } from 'pg';
import { pool } from '../../config/database';
import { runMigrations } from '../../config/migrate';

/** Neon's free-tier compute auto-suspends on inactivity (this service spins
 * down on Render too, so idle stretches are routine); a pooled connection
 * that outlives that suspend fails with a client-side transport error on
 * its next use, not a SQL error — safe to retry once against a fresh
 * connection rather than fail the whole request. */
function isStaleConnectionError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes('Connection terminated') || message.includes('terminated unexpectedly');
}

/** Postgres 42P01 = undefined_table. Observed live more than once: the
 * _migrations tracking table stays intact while the physical table
 * disappears. runMigrations() already self-heals this on boot; this catches
 * it mid-session too so a live desync never surfaces as a user-facing 500. */
function isMissingTableError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '42P01';
}

/** Concurrent requests hitting the same missing-table error coalesce into
 * one migration run rather than racing each other. */
let healInFlight: Promise<void> | null = null;
function healSchema(): Promise<void> {
  if (!healInFlight) {
    console.warn('relation does not exist mid-session — re-running migrations to self-heal');
    healInFlight = runMigrations().finally(() => {
      healInFlight = null;
    });
  }
  return healInFlight;
}

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

export async function queryOne<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
