// src/modules/demo-requests/demo-requests.schema.ts
import { z } from 'zod';

const phone = z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number');

export const createDemoRequestBody = z.object({
  name: z.string().trim().min(2).max(100),
  phone,
  email: z.string().trim().email('Invalid email').max(200),
  gymName: z.string().trim().min(2).max(150),
  city: z.string().trim().max(100).optional(),
  area: z.string().trim().max(100).optional(),
  memberCount: z.enum(['<100', '100-300', '300-600', '600+']).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export type CreateDemoRequestBody = z.infer<typeof createDemoRequestBody>;
