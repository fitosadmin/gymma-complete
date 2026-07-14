// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Render sits behind a reverse proxy that sets X-Forwarded-For — without
// this, express-rate-limit can't safely resolve the real client IP for
// authLimiter (register/login are still IP-keyed) and logs a validation
// warning on every request.
app.set('trust proxy', 1);

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1', apiRouter);

// 404 catch-all
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// ─── Error handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

export default app;
