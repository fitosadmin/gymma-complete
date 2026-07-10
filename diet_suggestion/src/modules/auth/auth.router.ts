// src/modules/auth/auth.router.ts
import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiter';
import * as controller from './auth.controller';
import { registerBody, loginBody, refreshBody } from './auth.schema';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate({ body: registerBody }), controller.register);
authRouter.post('/login',    authLimiter, validate({ body: loginBody }),    controller.login);
authRouter.post('/refresh',  validate({ body: refreshBody }), controller.refresh);
authRouter.post('/logout',   validate({ body: refreshBody }), controller.logout);
authRouter.get('/me', requireAuth, controller.me);
