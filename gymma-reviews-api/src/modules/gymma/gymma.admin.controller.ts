// src/modules/gymma/gymma.admin.controller.ts
import type { Request, Response } from 'express';
import { success } from '../../shared/response/envelope';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as service from './gymma.service';
import type {
  RecalculateBody,
  UpdateDimensionWeightBody,
  DimensionKeyParam,
  SubmissionsListQuery,
  SubmissionIdParam,
} from './gymma.schema';

export const recalculate = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as RecalculateBody;
  const data = body.all
    ? await service.recalculateAllGyms()
    : await service.recalculateGymScore(body.gym_id!);
  res.json(success(data));
});

export const getDimensions = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getAdminDimensions();
  res.json(success(data));
});

export const updateDimension = asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params as unknown as DimensionKeyParam;
  const { weight } = req.body as UpdateDimensionWeightBody;
  const data = await service.updateDimensionWeight(key, weight);
  res.json(success(data));
});

export const runEwm = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.runEwmRecalculation();
  res.json(success(data));
});

export const listSubmissions = asyncHandler(async (req: Request, res: Response) => {
  const q = req.validatedQuery as SubmissionsListQuery;
  const { data, meta } = await service.listSubmissionsForModeration({
    gymId: q.gym_id,
    flaggedOnly: q.flagged_only,
    page: q.page,
    limit: q.limit,
  });
  res.json(
    success(data, {
      page: meta.page,
      limit: meta.limit,
      total: meta.total,
      totalPages: Math.ceil(meta.total / meta.limit),
    }),
  );
});

export const invalidateSubmission = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as SubmissionIdParam;
  const data = await service.invalidateSubmission(id);
  res.json(success(data));
});
