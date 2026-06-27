// src/app.ts
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRouter } from './routes';

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1); // correct client IP behind proxy (rate limiting)

  app.use(helmet());
  app.use(
    cors({
      origin: (_origin, cb) => cb(null, true),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
