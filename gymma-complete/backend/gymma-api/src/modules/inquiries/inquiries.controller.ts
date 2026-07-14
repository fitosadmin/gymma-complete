// src/modules/inquiries/inquiries.controller.ts
import type { Request, Response } from 'express';
import { success } from '../../shared/response/envelope';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as service from './inquiries.service';
import type { CreateInquiryBody } from './inquiries.schema';

export const createInquiry = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateInquiryBody;
  const { id } = await service.createInquiry(body);
  res.status(201).json(success({ id }));
});
