// src/modules/demo-requests/demo-requests.controller.ts
import type { Request, Response } from 'express';
import { success } from '../../shared/response/envelope';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { insertDemoRequest } from './demo-requests.repository';
import type { CreateDemoRequestBody } from './demo-requests.schema';

export const createDemoRequest = asyncHandler(async (req: Request, res: Response) => {
  await insertDemoRequest(req.body as CreateDemoRequestBody);
  res.status(201).json(success({ received: true }));
});
