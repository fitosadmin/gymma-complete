// src/modules/gymma/gymma.owner.controller.ts
import type { Request, Response } from 'express';
import { success } from '../../shared/response/envelope';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as service from './gymma.service';

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getOwnerDashboard(req.params.gymId);
  res.json(success(data));
});
