// src/modules/auth/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';
import * as repo from './auth.repository';
import type { RegisterBody, LoginBody } from './auth.schema';

const BCRYPT_COST = 12;

// ─── Token helpers ────────────────────────────────────────────────────────────

function signAccessToken(payload: { sub: string; role: string }): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
  });
}

function generateRefreshToken(): { token: string; hash: string; expiresAt: Date } {
  const token = crypto.randomBytes(40).toString('hex');
  const hash  = repo.hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  return { token, hash, expiresAt };
}

async function issueTokens(user: repo.UserRow) {
  const access  = signAccessToken({ sub: user.id, role: user.role });
  const refresh = generateRefreshToken();
  await repo.insertRefreshToken(user.id, refresh.hash, refresh.expiresAt);
  return {
    accessToken:  access,
    refreshToken: refresh.token,
    user: {
      id:       user.id,
      fullName: user.full_name,
      phone:    user.phone,
      email:    user.email,
      role:     user.role,
    },
  };
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function register(body: RegisterBody) {
  // Duplicate phone check
  const existingPhone = await repo.findByIdentifier(body.phone);
  if (existingPhone) {
    throw AppError.conflict('An account with this phone number already exists');
  }

  // Duplicate email check (if provided)
  if (body.email) {
    const existingEmail = await repo.findByIdentifier(body.email);
    if (existingEmail) {
      throw AppError.conflict('An account with this email already exists');
    }
  }

  const passwordHash = await bcrypt.hash(body.password, BCRYPT_COST);
  const user = await repo.createMember({
    fullName:     body.fullName,
    phone:        body.phone,
    email:        body.email,
    passwordHash,
  });

  return issueTokens(user);
}

export async function login(body: LoginBody) {
  const user = await repo.findByIdentifier(body.identifier);
  const invalid = AppError.unauthorized('Invalid credentials');

  if (!user || !user.password_hash) throw invalid;

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw AppError.forbidden('Account temporarily locked. Try again in 15 minutes.');
  }

  const ok = await bcrypt.compare(body.password, user.password_hash);
  if (!ok) {
    await repo.recordLoginFailure(user.id);
    throw invalid;
  }

  await repo.recordLoginSuccess(user.id);
  return issueTokens(user);
}

export async function refresh(refreshToken: string) {
  const hash = repo.hashToken(refreshToken);
  const row  = await repo.findRefreshToken(hash);
  const invalid = AppError.unauthorized('Invalid or expired refresh token');

  if (!row || row.revoked_at || new Date(row.expires_at) < new Date()) throw invalid;

  const user = await repo.findById(row.user_id);
  if (!user) throw invalid;

  // Rotate: revoke old, issue new pair
  await repo.revokeRefreshToken(hash);
  return issueTokens(user);
}

export async function logout(refreshToken: string) {
  await repo.revokeRefreshToken(repo.hashToken(refreshToken));
}

export async function me(userId: string) {
  const user = await repo.findById(userId);
  if (!user) throw AppError.notFound('User not found');
  return {
    id:       user.id,
    fullName: user.full_name,
    phone:    user.phone,
    email:    user.email,
    role:     user.role,
  };
}
