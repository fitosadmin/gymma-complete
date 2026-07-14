// src/shared/email/email.ts
import { env, isProd } from '../../config/env';
import { logger } from '../../config/logger';

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends via Resend if RESEND_API_KEY is set, otherwise logs the email (dev).
 * Never throws into the request path — email failures are logged, not fatal.
 */
export async function sendEmail({ to, subject, html }: SendArgs): Promise<void> {
  if (!env.RESEND_API_KEY) {
    logger.info({ to, subject, html }, '[email:dev] (no RESEND_API_KEY — not sent)');
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, html }),
    });
    if (!res.ok) {
      logger.error({ status: res.status, body: await res.text() }, 'resend send failed');
    }
  } catch (err) {
    logger.error({ err }, 'email send threw');
  }
}

export function verificationEmail(link: string): { subject: string; html: string } {
  return {
    subject: 'Verify your Gymma account',
    html: `<p>Welcome to Gymma. Confirm your email:</p><p><a href="${link}">Verify email</a></p>`,
  };
}

export function resetEmail(link: string): { subject: string; html: string } {
  return {
    subject: 'Reset your Gymma password',
    html: `<p>Reset your password (valid 1 hour):</p><p><a href="${link}">Reset password</a></p>`,
  };
}

void isProd;
