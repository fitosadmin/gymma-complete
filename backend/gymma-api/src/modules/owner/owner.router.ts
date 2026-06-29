// src/modules/owner/owner.router.ts
import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { verifyGymOwnership } from './owner.middleware';
import * as controller from './owner.controller';
import {
  gymIdParam,
  inquiryIdParam,
  listInquiriesQuery,
  updateInquiryBody,
  updateGymBody,
  onboardGymBody,
} from './owner.schema';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 }, // 5MB each, 10 max
});

export const ownerRouter = Router();

// every owner route requires a logged-in owner
ownerRouter.use(requireAuth, requireRole('owner'));

ownerRouter.get('/gyms', controller.listGyms);

ownerRouter.get(
  '/gyms/:gymId/stats',
  validate({ params: gymIdParam }),
  verifyGymOwnership,
  controller.getStats,
);

ownerRouter.get(
  '/gyms/:gymId/inquiries',
  validate({ params: gymIdParam, query: listInquiriesQuery }),
  verifyGymOwnership,
  controller.listInquiries,
);

ownerRouter.patch(
  '/inquiries/:id',
  validate({ params: inquiryIdParam, body: updateInquiryBody }),
  controller.updateInquiry, // ownership enforced inside the SQL update
);

ownerRouter.put(
  '/gyms/:gymId',
  validate({ params: gymIdParam, body: updateGymBody }),
  verifyGymOwnership,
  controller.updateGym,
);

ownerRouter.put(
  '/gyms/:gymId/onboard',
  validate({ params: gymIdParam, body: onboardGymBody }),
  verifyGymOwnership,
  controller.onboardGym,
);

ownerRouter.post(
  '/gyms/:gymId/gallery',
  validate({ params: gymIdParam }),
  verifyGymOwnership,
  upload.array('images', 10),
  controller.uploadGallery,
);
