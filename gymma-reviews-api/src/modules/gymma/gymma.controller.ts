// src/modules/gymma/gymma.controller.ts
import type { Request, Response } from 'express';
import { success } from '../../shared/response/envelope';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as service from './gymma.service';
import type { GymIdQuery, SubmitPollBody, LeaderboardQuery, HistoryQuery } from './gymma.schema';

export const health = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getHealth();
  res.json(success(data));
});

export const getPoll = asyncHandler(async (req: Request, res: Response) => {
  const q = req.validatedQuery as GymIdQuery;
  const data = await service.getPoll(q.gym_id);
  res.json(success(data));
});

export const submitPoll = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as SubmitPollBody;
  const data = await service.submitPoll(
    req.user!.id,
    body.gym_id,
    body.responses,
    body.submission_time_ms,
  );
  res.json(success(data));
});

export const getGymScore = asyncHandler(async (req: Request, res: Response) => {
  const q = req.validatedQuery as GymIdQuery;
  const data = await service.getGymScore(q.gym_id);
  res.json(success(data));
});

export const getDimensionBreakdown = asyncHandler(async (req: Request, res: Response) => {
  const q = req.validatedQuery as GymIdQuery;
  const data = await service.getDimensionBreakdown(q.gym_id);
  res.json(success(data));
});

export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const q = req.validatedQuery as LeaderboardQuery;
  const data = await service.getLeaderboard(q.tier_min, q.limit);
  res.json(success(data));
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const q = req.validatedQuery as HistoryQuery;
  const data = await service.getHistory(q.gym_id, q.days);
  res.json(success(data));
});
