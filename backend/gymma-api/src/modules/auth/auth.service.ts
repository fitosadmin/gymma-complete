// src/modules/auth/auth.service.ts
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';
import { sendEmail, verificationEmail, resetEmail } from '../../shared/email/email';
import * as repo from './auth.repository';
import type { UserRow } from './auth.repository';
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
} from './tokens';
import { verifyGoogleIdToken } from './google.strategy';

const BCRYPT_COST = 12;

export interface PublicUser {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRow['role'];
  avatarUrl: string | null;
  emailVerified: boolean;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

function toPublic(u: UserRow): PublicUser {
  return {
    id: u.id,
    email: u.email,
    fullName: u.full_name,
    role: u.role,
    avatarUrl: u.avatar_url,
    emailVerified: u.email_verified,
  };
}

async function issueTokens(user: UserRow): Promise<AuthResult> {
  const access = signAccessToken({ sub: user.id, role: user.role });
  const refresh = generateRefreshToken();
  await repo.insertRefreshToken(user.id, refresh.hash, refresh.expiresAt);
  return { accessToken: access, refreshToken: refresh.token, user: toPublic(user) };
}

// ---------------------------------------------------------------------------
export async function register(input: {
  email: string;
  password: string;
  fullName: string;
}): Promise<AuthResult> {
  const existing = await repo.findByEmail(input.email);
  if (existing) throw AppError.conflict('An account with this email already exists');

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  const user = await repo.createUser({
    email: input.email,
    passwordHash,
    fullName: input.fullName,
    role: 'owner',
  });

  // fire-and-forget verification email
  const link = `${env.FRONTEND_ORIGIN}/verify-email?uid=${user.id}`;
  void sendEmail({ to: user.email, ...verificationEmail(link) });

  return issueTokens(user);
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const user = await repo.findByEmail(input.email);
  // generic error to avoid account enumeration
  const invalid = AppError.unauthorized('Invalid email or password');

  if (!user || !user.password_hash) throw invalid;

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw AppError.forbidden('Account temporarily locked. Try again later.');
  }

  const ok = await bcrypt.compare(input.password, user.password_hash);
  if (!ok) {
    await repo.recordLoginFailure(user.id);
    throw invalid;
  }

  await repo.recordLoginSuccess(user.id);
  return issueTokens(user);
}

export async function loginWithGoogle(idToken: string): Promise<AuthResult> {
  const profile = await verifyGoogleIdToken(idToken);

  let user = await repo.findByEmail(profile.email);
  if (!user) {
    user = await repo.createUser({
      email: profile.email,
      passwordHash: null,
      fullName: profile.name ?? profile.email,
      role: 'owner',
      googleId: profile.googleId,
      avatarUrl: profile.picture,
      emailVerified: profile.emailVerified,
    });
  } else if (!user.google_id) {
    await repo.linkGoogleId(user.id, profile.googleId, profile.picture);
  }

  await repo.recordLoginSuccess(user.id);
  return issueTokens(user);
}

export async function refresh(refreshToken: string): Promise<AuthResult> {
  const tokenHash = hashToken(refreshToken);
  const row = await repo.findRefreshToken(tokenHash);

  const invalid = AppError.unauthorized('Invalid or expired refresh token');
  if (!row || row.revoked_at || new Date(row.expires_at) < new Date()) {
    throw invalid;
  }

  const user = await repo.findById(row.user_id);
  if (!user) throw invalid;

  // rotate: revoke old, issue new pair
  await repo.revokeRefreshToken(tokenHash);
  return issueTokens(user);
}

export async function logout(refreshToken: string): Promise<void> {
  await repo.revokeRefreshToken(hashToken(refreshToken));
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await repo.findByEmail(email);
  // Always succeed silently — never reveal whether the email exists.
  if (!user) return;

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await repo.insertResetToken(user.id, hashToken(token), expiresAt);

  const link = `${env.FRONTEND_ORIGIN}/reset-password?token=${token}`;
  void sendEmail({ to: user.email, ...resetEmail(link) });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const row = await repo.findResetToken(hashToken(token));
  if (!row || row.used_at || new Date(row.expires_at) < new Date()) {
    throw AppError.unauthorized('Reset link is invalid or has expired');
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
  await repo.updatePassword(row.user_id, passwordHash);
  await repo.markResetUsed(row.id);
  await repo.revokeAllForUser(row.user_id); // log out everywhere
}

export async function me(userId: string): Promise<PublicUser> {
  const user = await repo.findById(userId);
  if (!user) throw AppError.notFound('User not found');
  return toPublic(user);
}
