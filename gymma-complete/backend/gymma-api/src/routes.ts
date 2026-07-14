// src/routes.ts
import { Router } from 'express';
import { gymsRouter } from './modules/gyms/gyms.router';
import { inquiriesRouter } from './modules/inquiries/inquiries.router';
import { demoRequestsRouter } from './modules/demo-requests/demo-requests.router';
import { authRouter } from './modules/auth/auth.router';
import { ownerRouter } from './modules/owner/owner.router';
import { adminRouter } from './modules/admin/admin.router';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', ts: new Date().toISOString() } });
});

apiRouter.use('/gyms', gymsRouter);
apiRouter.use('/inquiries', inquiriesRouter);
apiRouter.use('/demo-requests', demoRequestsRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/owner', ownerRouter);
apiRouter.use('/admin', adminRouter);
