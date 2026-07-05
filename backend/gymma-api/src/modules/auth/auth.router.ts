// src/modules/auth/auth.router.ts
import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authLimiter } from '../../middleware/rateLimiter';
import { requireAuth } from '../../middleware/auth';
import * as controller from './auth.controller';
import {
  registerBody,
  loginBody,
  googleBody,
  googleAdminBody,
  refreshBody,
  forgotPasswordBody,
  resetPasswordBody,
} from './auth.schema';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate({ body: registerBody }), controller.register);
authRouter.post('/login', authLimiter, validate({ body: loginBody }), controller.login);
authRouter.post('/google', authLimiter, validate({ body: googleBody }), controller.google);
authRouter.post('/google-admin', authLimiter, validate({ body: googleAdminBody }), controller.googleAdmin);
authRouter.post('/google-owner', authLimiter, validate({ body: googleAdminBody }), controller.googleOwner);
authRouter.post('/refresh', validate({ body: refreshBody }), controller.refresh);
authRouter.post('/logout', validate({ body: refreshBody }), controller.logout);
authRouter.post(
  '/forgot-password',
  authLimiter,
  validate({ body: forgotPasswordBody }),
  controller.forgotPassword,
);
authRouter.post(
  '/reset-password',
  authLimiter,
  validate({ body: resetPasswordBody }),
  controller.resetPassword,
);

authRouter.get('/me', requireAuth, controller.me);
