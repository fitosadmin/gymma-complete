// src/modules/auth/auth.repository.ts
import { query, queryOne } from '../../shared/db/query';
import crypto from 'node:crypto';

export interface UserRow {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  password_hash: string | null;
  role: string;
  email_verified: boolean;
  failed_attempts: number;
  locked_until: string | null;
  created_at: string;
}

export interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
}

// ─── User queries ─────────────────────────────────────────────────────────────

export function findByIdentifier(identifier: string) {
  return queryOne<UserRow>(
    'SELECT * FROM users WHERE (email = $1 OR phone = $1) AND deleted_at IS NULL',
    [identifier],
  );
}

export function findById(id: string) {
  return queryOne<UserRow>(
    'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
    [id],
  );
}

export async function createMember(args: {
  fullName: string;
  phone: string;
  email?: string;
  passwordHash: string;
}): Promise<UserRow> {
  // Insert with phone; email is nullable
  const row = await queryOne<UserRow>(
    `INSERT INTO users (full_name, phone, email, password_hash, role, email_verified)
     VALUES ($1, $2, NULLIF($3,''), $4, 'member', false)
     RETURNING *`,
    [args.fullName, args.phone, args.email ?? '', args.passwordHash],
  );
  return row!;
}

export async function recordLoginSuccess(userId: string) {
  await query(
    'UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = $1',
    [userId],
  );
}

export async function recordLoginFailure(userId: string) {
  await query(
    `UPDATE users
     SET failed_attempts = failed_attempts + 1,
         locked_until = CASE WHEN failed_attempts + 1 >= 5
                             THEN NOW() + INTERVAL '15 minutes' ELSE locked_until END
     WHERE id = $1`,
    [userId],
  );
}

// ─── Refresh tokens ───────────────────────────────────────────────────────────

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function insertRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)',
    [userId, tokenHash, expiresAt],
  );
}

export function findRefreshToken(tokenHash: string) {
  return queryOne<RefreshTokenRow>(
    'SELECT * FROM refresh_tokens WHERE token_hash = $1',
    [tokenHash],
  );
}

export async function revokeRefreshToken(tokenHash: string) {
  await query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL',
    [tokenHash],
  );
}
