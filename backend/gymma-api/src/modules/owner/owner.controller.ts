// src/modules/owner/owner.controller.ts
import type { Request, Response } from 'express';
import { success } from '../../shared/response/envelope';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as service from './owner.service';
import type { ListInquiriesQuery, UpdateInquiryBody, UpdateGymBody, OnboardGymBody } from './owner.schema';

export const listGyms = asyncHandler(async (req: Request, res: Response) => {
  const gyms = await service.listGyms(req.user!.id);
  res.json(success(gyms));
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await service.getStats(req.params.gymId);
  res.json(success(stats));
});

export const listInquiries = asyncHandler(async (req: Request, res: Response) => {
  const q = req.validatedQuery as ListInquiriesQuery;
  const { data, meta } = await service.listInquiries(req.params.gymId, q);
  res.json(success(data, meta));
});

export const updateInquiry = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateInquiryBody;
  await service.updateInquiry(req.params.id, req.user!.id, body.status, body.notes);
  res.json(success({ updated: true }));
});

export const updateGym = asyncHandler(async (req: Request, res: Response) => {
  await service.updateGymProfile(req.params.gymId, req.body as UpdateGymBody);
  res.json(success({ updated: true }));
});

export const onboardGym = asyncHandler(async (req: Request, res: Response) => {
  await service.onboardGym(req.params.gymId, req.body as OnboardGymBody);
  res.json(success({ onboarded: true }));
});

export const uploadGallery = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  const inserted = await service.addGalleryImages(req.params.gymId, files);
  res.status(201).json(success(inserted));
});
