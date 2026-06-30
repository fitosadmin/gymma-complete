// src/modules/auth/auth.repository.ts
import { query, queryOne } from '../../shared/db/query';

export interface UserRow {
  id: string;
  email: string;
  phone: string | null;
  email_verified: boolean;
  password_hash: string | null;
  role: 'owner' | 'admin' | 'super_admin' | 'member';
  google_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
  failed_attempts: number;
  locked_until: string | null;
  created_at: string;
}

export async function findByEmail(email: string): Promise<UserRow | null> {
  return queryOne<UserRow>(
    'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
    [email],
  );
}

export async function findByIdentifier(identifier: string): Promise<UserRow | null> {
  return queryOne<UserRow>(
    'SELECT * FROM users WHERE (email = $1 OR phone = $1) AND deleted_at IS NULL',
    [identifier],
  );
}

export async function findById(id: string): Promise<UserRow | null> {
  return queryOne<UserRow>(
    'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
    [id],
  );
}

export async function createUser(args: {
  email: string;
  passwordHash: string | null;
  fullName: string;
  role?: 'owner' | 'admin';
  googleId?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
}): Promise<UserRow> {
  const row = await queryOne<UserRow>(
    `INSERT INTO users (email, password_hash, full_name, role, google_id, avatar_url, email_verified)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      args.email,
      args.passwordHash,
      args.fullName,
      args.role ?? 'owner',
      args.googleId ?? null,
      args.avatarUrl ?? null,
      args.emailVerified ?? false,
    ],
  );
  return row!;
}

export async function linkGoogleId(
  userId: string,
  googleId: string,
  avatarUrl?: string,
): Promise<void> {
  await query(
    `UPDATE users SET google_id = $2, avatar_url = COALESCE(avatar_url, $3), email_verified = TRUE
     WHERE id = $1`,
    [userId, googleId, avatarUrl ?? null],
  );
}

export async function recordLoginSuccess(userId: string): Promise<void> {
  await query(
    'UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = $1',
    [userId],
  );
}

/** Increments failures; locks for 15 min once 5 is reached. */
export async function recordLoginFailure(userId: string): Promise<void> {
  await query(
    `UPDATE users
        SET failed_attempts = failed_attempts + 1,
            locked_until = CASE WHEN failed_attempts + 1 >= 5
                                THEN NOW() + INTERVAL '15 minutes' ELSE locked_until END
      WHERE id = $1`,
    [userId],
  );
}

export async function updatePassword(userId: string, passwordHash: string): Promise<void> {
  await query(
    'UPDATE users SET password_hash = $2, failed_attempts = 0, locked_until = NULL WHERE id = $1',
    [userId, passwordHash],
  );
}

// --- refresh tokens --------------------------------------------------------
export interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
}

export async function insertRefreshToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)',
    [userId, tokenHash, expiresAt],
  );
}

export async function findRefreshToken(tokenHash: string): Promise<RefreshTokenRow | null> {
  return queryOne<RefreshTokenRow>(
    'SELECT * FROM refresh_tokens WHERE token_hash = $1',
    [tokenHash],
  );
}

export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  await query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL',
    [tokenHash],
  );
}

export async function revokeAllForUser(userId: string): Promise<void> {
  await query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
    [userId],
  );
}

// --- password reset tokens -------------------------------------------------
export async function insertResetToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)',
    [userId, tokenHash, expiresAt],
  );
}

export interface ResetTokenRow {
  id: string;
  user_id: string;
  expires_at: string;
  used_at: string | null;
}

export async function findResetToken(tokenHash: string): Promise<ResetTokenRow | null> {
  return queryOne<ResetTokenRow>(
    'SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = $1',
    [tokenHash],
  );
}

export async function markResetUsed(id: string): Promise<void> {
  await query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [id]);
}
