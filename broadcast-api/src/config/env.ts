// src/config/env.ts
import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3002),
  WS_PORT: z.coerce.number().default(3001),
  FRONTEND_ORIGIN: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  BULLMQ_REDIS_URL: z.string().min(1, 'BULLMQ_REDIS_URL is required'),

  ACCESS_TOKEN_SECRET: z.string().min(16, 'ACCESS_TOKEN_SECRET too short'),

  FCM_PROJECT_ID: z.string().optional().default(''),
  FCM_CLIENT_EMAIL: z.string().optional().default(''),
  FCM_PRIVATE_KEY: z.string().optional().default(''),
  FCM_SERVER_KEY: z.string().optional().default(''),

  API_RATE_LIMIT_BROADCASTS_PER_HOUR: z.coerce.number().default(10),
  MAX_BROADCAST_BATCH_SIZE: z.coerce.number().default(1000),
  MAX_PUSH_BATCH_SIZE: z.coerce.number().default(500),
  MAX_WS_CONNECTIONS_PER_USER: z.coerce.number().default(3),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export type Env = typeof env;
