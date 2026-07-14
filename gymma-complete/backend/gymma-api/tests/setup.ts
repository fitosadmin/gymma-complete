// tests/setup.ts
// Runs before any test module is imported, so config/env.ts validates cleanly.
process.env.NODE_ENV = 'test';
process.env.PORT ??= '3001';
process.env.FRONTEND_ORIGIN ??= 'http://localhost:3000';
process.env.DATABASE_URL ??= 'postgresql://gymma:gymma@localhost:5432/gymma_test';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.ACCESS_TOKEN_SECRET ??= 'test_access_secret_at_least_16_chars';
process.env.REFRESH_TOKEN_SECRET ??= 'test_refresh_secret_at_least_16_chars';
process.env.ACCESS_TOKEN_TTL ??= '900';
process.env.REFRESH_TOKEN_TTL ??= '2592000';
