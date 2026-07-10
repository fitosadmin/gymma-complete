// src/broadcast/controllers/broadcast.controller.ts
import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { success } from '../../shared/response/envelope';
import { AppError } from '../../shared/errors/AppError';
import { logger } from '../../config/logger';
import { recordBroadcastLatency } from '../../shared/utils/metrics';
import * as broadcastService from '../services/broadcast.service';
import type { CreateBroadcastBody, ListBroadcastsQuery, FcmTokenBody } from '../types/broadcast.schema';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const startedAt = Date.now();
  const body = req.body as CreateBroadcastBody;
  const senderId = req.user!.id;

  const result = await broadcastService.createBroadcast({
    gymId: body.gym_id,
    senderId,
    title: body.title,
    message: body.message,
    type: body.type,
    priority: body.priority,
  });

  await recordBroadcastLatency(Date.now() - startedAt);

  res.status(201).json(success(result));
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const q = req.validatedQuery as ListBroadcastsQuery;
  const userId = req.user!.id;

  const { data, meta, unreadTotal } = await broadcastService.listBroadcasts({
    gymId: q.gym_id,
    userId,
    page: q.page,
    limit: q.limit,
    unreadOnly: q.unread_only,
  });

  res.setHeader('X-Total-Unread', String(unreadTotal));
  res.json(success(data, meta));
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const isPlatformAdmin = req.user!.role === 'admin' || req.user!.role === 'super_admin';
  // The gym's own owner can see read receipts for their announcement too,
  // not just platform staff — requireGymMember already resolved req.gymId.
  const isOwner = req.gymId ? await broadcastService.isGymOwner(userId, req.gymId) : false;

  const broadcast = await broadcastService.getBroadcastById(req.params.id, userId, isPlatformAdmin || isOwner);
  if (!broadcast) {
    throw AppError.notFound('Broadcast not found');
  }

  res.json(success(broadcast));
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const gymId = req.gymId!;

  await broadcastService.markBroadcastRead(req.params.id, userId, gymId);
  res.status(204).send();
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const requester = req.user!;
  await broadcastService.softDeleteBroadcast(req.params.id, requester.id, requester.role);
  res.status(204).send();
});

export const registerFcmToken = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const body = req.body as FcmTokenBody;

  await broadcastService.upsertFcmToken(userId, body.token, body.platform, body.device_id);
  logger.info({ userId, platform: body.platform }, 'fcm token registered');

  res.status(200).json(success({ registered: true }));
});
