// src/modules/inquiries/inquiries.router.ts
import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { inquiryLimiter } from '../../middleware/rateLimiter';
import { createInquiryBody } from './inquiries.schema';
import * as controller from './inquiries.controller';

export const inquiriesRouter = Router();

inquiriesRouter.post(
  '/',
  inquiryLimiter,
  validate({ body: createInquiryBody }),
  controller.createInquiry,
);
