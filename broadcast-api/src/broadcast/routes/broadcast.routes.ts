// src/broadcast/routes/broadcast.routes.ts
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { requireGymSender } from '../middleware/require-gym-sender.middleware';
import { requireGymMember } from '../middleware/require-gym-member.middleware';
import { rateLimitBroadcasts } from '../middleware/rate-limit-broadcasts.middleware';
import * as controller from '../controllers/broadcast.controller';
import {
  createBroadcastBody,
  listBroadcastsQuery,
  broadcastIdParams,
  fcmTokenBody,
} from '../types/broadcast.schema';

export const broadcastRouter = Router();

// POST /api/v1/broadcasts
// requireGymSender resolves + validates gym_id (owner_gym_links, or platform
// admin) in one step — a separate membership check isn't needed here since
// gym owners aren't rows in gym_members.
broadcastRouter.post(
  '/',
  requireAuth,
  validate({ body: createBroadcastBody }),
  requireGymSender,
  rateLimitBroadcasts,
  controller.create,
);

// GET /api/v1/broadcasts
broadcastRouter.get(
  '/',
  requireAuth,
  validate({ query: listBroadcastsQuery }),
  requireGymMember,
  controller.list,
);

// GET /api/v1/broadcasts/:id
broadcastRouter.get(
  '/:id',
  requireAuth,
  validate({ params: broadcastIdParams }),
  requireGymMember,
  controller.getOne,
);

// PATCH /api/v1/broadcasts/:id/read
broadcastRouter.patch(
  '/:id/read',
  requireAuth,
  validate({ params: broadcastIdParams }),
  requireGymMember,
  controller.markRead,
);

// DELETE /api/v1/broadcasts/:id
// No extra authorization middleware — softDeleteBroadcast enforces
// "sender or super_admin only" itself, and duplicating that check here would
// just be two sources of truth for the same rule.
broadcastRouter.delete(
  '/:id',
  requireAuth,
  validate({ params: broadcastIdParams }),
  controller.remove,
);

export const usersRouter = Router();

// POST /api/v1/users/fcm-token
usersRouter.post(
  '/fcm-token',
  requireAuth,
  validate({ body: fcmTokenBody }),
  controller.registerFcmToken,
);
