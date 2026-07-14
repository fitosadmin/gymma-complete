// src/modules/auth/auth.schema.ts
import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password needs an uppercase letter')
  .regex(/[0-9]/, 'Password needs a number');

/** POST /auth/register — phone-first member signup */
export const registerBody = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  email: z.string().trim().email().max(200).toLowerCase().optional(),
  password,
});

/** POST /auth/login — phone or email + password */
export const loginBody = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
});

/** POST /auth/refresh */
export const refreshBody = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterBody  = z.infer<typeof registerBody>;
export type LoginBody     = z.infer<typeof loginBody>;
export type RefreshBody   = z.infer<typeof refreshBody>;
