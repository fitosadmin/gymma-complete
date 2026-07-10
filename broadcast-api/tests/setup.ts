// tests/setup.ts
// Runs before any test module is imported, so config/env.ts validates cleanly.
process.env.NODE_ENV = 'test';
process.env.PORT ??= '3002';
process.env.WS_PORT ??= '3003';
process.env.FRONTEND_ORIGIN ??= 'http://localhost:3000';
process.env.DATABASE_URL ??= 'postgresql://gymma:gymma@localhost:5432/broadcast_test';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.BULLMQ_REDIS_URL ??= 'redis://localhost:6379';
process.env.ACCESS_TOKEN_SECRET ??= 'test_access_secret_at_least_16_chars';
