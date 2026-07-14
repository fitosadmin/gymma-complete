// src/modules/gymma/gymma.router.ts
import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { verifyGymOwnership } from '../owner/owner.middleware';
import * as controller from './gymma.controller';
import * as ownerController from './gymma.owner.controller';
import * as adminController from './gymma.admin.controller';
import {
  gymIdQuery,
  submitPollBody,
  leaderboardQuery,
  historyQuery,
  recalculateBody,
  dimensionKeyParam,
  updateDimensionWeightBody,
  submissionsListQuery,
  submissionIdParam,
} from './gymma.schema';
import { z } from 'zod';

export const gymmaRouter = Router();

// ---------------------------------------------------------------------------
// PUBLIC & MEMBER (Prefix: /)
// ---------------------------------------------------------------------------
gymmaRouter.get('/health', controller.health);
gymmaRouter.get('/poll', requireAuth, requireRole('member'), validate({ query: gymIdQuery }), controller.getPoll);
gymmaRouter.post('/submit', requireAuth, requireRole('member'), validate({ body: submitPollBody }), controller.submitPoll);
gymmaRouter.get('/gym-score', validate({ query: gymIdQuery }), controller.getGymScore);
gymmaRouter.get('/dimension-breakdown', validate({ query: gymIdQuery }), controller.getDimensionBreakdown);
gymmaRouter.get('/leaderboard', validate({ query: leaderboardQuery }), controller.getLeaderboard);
gymmaRouter.get('/history', validate({ query: historyQuery }), controller.getHistory);

// ---------------------------------------------------------------------------
// OWNER (Prefix: /owner)
// ---------------------------------------------------------------------------
const gymIdParam = z.object({ gymId: z.string().uuid('Invalid gym ID format') });

gymmaRouter.get(
  '/owner/gyms/:gymId/dashboard',
  requireAuth,
  requireRole('owner'),
  validate({ params: gymIdParam }),
  verifyGymOwnership,
  ownerController.getDashboard
);

// ---------------------------------------------------------------------------
// ADMIN (Prefix: /admin)
// ---------------------------------------------------------------------------
gymmaRouter.post(
  '/admin/recalculate',
  requireAuth,
  requireRole('admin', 'super_admin'),
  validate({ body: recalculateBody }),
  adminController.recalculate
);
gymmaRouter.get(
  '/admin/dimensions',
  requireAuth,
  requireRole('admin', 'super_admin'),
  adminController.getDimensions
);
gymmaRouter.put(
  '/admin/dimensions/:key',
  requireAuth,
  requireRole('admin', 'super_admin'),
  validate({ params: dimensionKeyParam, body: updateDimensionWeightBody }),
  adminController.updateDimension
);
gymmaRouter.post(
  '/admin/run-ewm',
  requireAuth,
  requireRole('admin', 'super_admin'),
  adminController.runEwm
);
gymmaRouter.get(
  '/admin/submissions',
  requireAuth,
  requireRole('admin', 'super_admin'),
  validate({ query: submissionsListQuery }),
  adminController.listSubmissions
);
gymmaRouter.patch(
  '/admin/submissions/:id',
  requireAuth,
  requireRole('admin', 'super_admin'),
  validate({ params: submissionIdParam }),
  adminController.invalidateSubmission
);
