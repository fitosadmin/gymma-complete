// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

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
