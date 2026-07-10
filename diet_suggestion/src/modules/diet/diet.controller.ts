// src/modules/diet/diet.controller.ts
import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { success } from '../../shared/response/envelope';
import * as service from './diet.service';
import type { CalculateBody, UpdateNoteBody, PlanParams, ListQuery } from './diet.schema';

export const calculate = asyncHandler(async (req: Request, res: Response) => {
  const plan = await service.calculate(req.user!.sub, req.body as CalculateBody);
  res.status(201).json(success(plan));
});

export const listPlans = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as ListQuery;
  const { plans, meta } = await service.listPlans(req.user!.sub, page, limit);
  res.json(success(plans, meta));
});

export const getPlan = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as PlanParams;
  const plan = await service.getPlan(id, req.user!.sub);
  res.json(success(plan));
});

export const getActivePlan = asyncHandler(async (req: Request, res: Response) => {
  const plan = await service.getActivePlan(req.user!.sub);
  res.json(success(plan));
});

export const updateNote = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as PlanParams;
  const plan = await service.updateNote(id, req.user!.sub, req.body as UpdateNoteBody);
  res.json(success(plan));
});

export const deletePlan = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as PlanParams;
  await service.deletePlan(id, req.user!.sub);
  res.json(success({ deleted: true }));
});
