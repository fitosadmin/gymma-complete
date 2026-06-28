// src/modules/auth/auth.schema.ts
import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password needs an uppercase letter')
  .regex(/[0-9]/, 'Password needs a number');

export const registerBody = z.object({
  email: z.string().trim().email().max(200).toLowerCase(),
  password,
  fullName: z.string().trim().min(2).max(120),
});

export const loginBody = z.object({
  email: z.string().trim().email().max(200).toLowerCase(),
  password: z.string().min(1),
});

export const googleBody = z.object({
  idToken: z.string().min(1),
});

export const refreshBody = z.object({
  refreshToken: z.string().min(1),
});

export const forgotPasswordBody = z.object({
  email: z.string().trim().email().max(200).toLowerCase(),
});

export const resetPasswordBody = z.object({
  token: z.string().min(1),
  newPassword: password,
});

export type RegisterBody = z.infer<typeof registerBody>;
export type LoginBody = z.infer<typeof loginBody>;
export type GoogleBody = z.infer<typeof googleBody>;
export type RefreshBody = z.infer<typeof refreshBody>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBody>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBody>;

// Admin-portal specific: same shape as googleBody but semantically distinct.
export const googleAdminBody = z.object({
  idToken: z.string().min(1),
});
export type GoogleAdminBody = z.infer<typeof googleAdminBody>;
