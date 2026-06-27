// src/modules/admin/admin.controller.ts
import type { Request, Response } from 'express';
import { success } from '../../shared/response/envelope';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as service from './admin.service';
import type {
  CreateGymBody,
  UpdateGymBody,
  ListQuery,
  UpdateDemoRequestBody,
  LinkOwnerBody,
} from './admin.schema';

export const listGyms = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await service.listGyms(req.validatedQuery as ListQuery);
  res.json(success(data, meta));
});

export const createGym = asyncHandler(async (req: Request, res: Response) => {
  const { id } = await service.createGym(req.body as CreateGymBody);
  res.status(201).json(success({ id }));
});

export const updateGym = asyncHandler(async (req: Request, res: Response) => {
  await service.updateGym(req.params.id, req.body as UpdateGymBody);
  res.json(success({ updated: true }));
});

export const deleteGym = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteGym(req.params.id);
  res.json(success({ deleted: true }));
});

export const listInquiries = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await service.listInquiries(req.validatedQuery as ListQuery);
  res.json(success(data, meta));
});

export const listDemoRequests = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await service.listDemoRequests(req.validatedQuery as ListQuery);
  res.json(success(data, meta));
});

export const updateDemoRequest = asyncHandler(async (req: Request, res: Response) => {
  await service.updateDemoRequest(req.params.id, req.body as UpdateDemoRequestBody);
  res.json(success({ updated: true }));
});

export const linkOwner = asyncHandler(async (req: Request, res: Response) => {
  await service.linkOwner(req.params.id, req.body as LinkOwnerBody);
  res.status(201).json(success({ linked: true }));
});
