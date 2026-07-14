// src/routes.ts
import { Router } from 'express';
import { authRouter } from './modules/auth/auth.router';
import { dietRouter } from './modules/diet/diet.router';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', service: 'diet-suggestion', ts: new Date().toISOString() } });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/diet', dietRouter);
