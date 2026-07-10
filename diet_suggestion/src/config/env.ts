// src/config/env.ts
import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  PORT:                    z.coerce.number().default(4000),
  NODE_ENV:                z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL:            z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET:              z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN:   z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN:  z.string().default('7d'),
  ALLOWED_ORIGINS:         z.string().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid environment variables:\n', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
