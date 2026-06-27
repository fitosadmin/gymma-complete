// src/modules/auth/google.strategy.ts
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';

export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

interface TokenInfo {
  aud: string;
  sub: string;
  email: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  exp?: string;
}

/** Verifies a Google ID token and returns the profile, or throws 401. */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new AppError(500, 'INTERNAL_ERROR', 'Google login is not configured');
  }

  let info: TokenInfo;
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    );
    if (!res.ok) throw AppError.unauthorized('Invalid Google token');
    info = (await res.json()) as TokenInfo;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw AppError.unauthorized('Could not verify Google token');
  }

  if (info.aud !== env.GOOGLE_CLIENT_ID) {
    throw AppError.unauthorized('Google token audience mismatch');
  }
  if (!info.email) {
    throw AppError.unauthorized('Google token has no email');
  }

  return {
    googleId: info.sub,
    email: info.email.toLowerCase(),
    emailVerified: info.email_verified === true || info.email_verified === 'true',
    name: info.name,
    picture: info.picture,
  };
}
