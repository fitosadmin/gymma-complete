// src/modules/inquiries/inquiries.schema.ts
import { z } from 'zod';

const phone = z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number');

export const createInquiryBody = z.object({
  gymId: z.string().uuid('Invalid gym id'),
  name: z.string().trim().min(2, 'Name too short').max(100),
  phone,
  message: z.string().trim().max(500).optional(),
  planInterest: z.string().trim().max(100).optional(),
  sourcePage: z.string().trim().max(200).optional(),
  utmSource: z.string().trim().max(100).optional(),
});

export type CreateInquiryBody = z.infer<typeof createInquiryBody>;
