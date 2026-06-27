// src/modules/admin/admin.router.ts
import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './admin.controller';
import {
  idParam,
  listQuery,
  createGymBody,
  updateGymBody,
  updateDemoRequestBody,
  linkOwnerBody,
} from './admin.schema';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('admin', 'super_admin'));

// gyms
adminRouter.get('/gyms', validate({ query: listQuery }), controller.listGyms);
adminRouter.post('/gyms', validate({ body: createGymBody }), controller.createGym);
adminRouter.put('/gyms/:id', validate({ params: idParam, body: updateGymBody }), controller.updateGym);
adminRouter.delete('/gyms/:id', validate({ params: idParam }), controller.deleteGym);
adminRouter.post(
  '/gyms/:id/owner',
  validate({ params: idParam, body: linkOwnerBody }),
  controller.linkOwner,
);

// leads
adminRouter.get('/inquiries', validate({ query: listQuery }), controller.listInquiries);
adminRouter.get('/demo-requests', validate({ query: listQuery }), controller.listDemoRequests);
adminRouter.patch(
  '/demo-requests/:id',
  validate({ params: idParam, body: updateDemoRequestBody }),
  controller.updateDemoRequest,
);
