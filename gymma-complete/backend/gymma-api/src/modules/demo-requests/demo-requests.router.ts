// src/modules/demo-requests/demo-requests.router.ts
import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { demoRequestLimiter } from '../../middleware/rateLimiter';
import { createDemoRequestBody } from './demo-requests.schema';
import * as controller from './demo-requests.controller';

export const demoRequestsRouter = Router();

demoRequestsRouter.post(
  '/',
  demoRequestLimiter,
  validate({ body: createDemoRequestBody }),
  controller.createDemoRequest,
);
