// src/modules/admin/admin.schema.ts
import { z } from 'zod';

export const idParam = z.object({ id: z.string().uuid() });

export const listQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

const time = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/);

export const createGymBody = z.object({
  name: z.string().trim().min(2).max(150),
  slug: z.string().trim().min(2).max(150).optional(), // auto from name if absent
  description: z.string().trim().max(4000).optional(),
  area: z.string().trim().min(1).max(100),
  city: z.string().trim().max(100).default('Bengaluru'),
  phone: z.string().trim().max(20).optional(),
  whatsapp: z.string().trim().max(20).optional(),
  addressLine: z.string().trim().max(300).optional(),
  website: z.string().trim().url().max(300).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  pricePerMonth: z.number().int().nonnegative(), // rupees
  isPremium: z.boolean().default(false),
  womenFriendly: z.boolean().default(false),
  hasParking: z.boolean().default(false),
  opensAt: time.optional(),
  closesAt: time.optional(),
  yearsOperating: z.number().int().nonnegative().optional(),
  coverImageUrl: z.string().trim().url().optional(),
  amenities: z.array(z.string()).optional(),
});

export const updateGymBody = createGymBody.partial();

export const updateDemoRequestBody = z.object({
  status: z.enum(['pending', 'contacted', 'onboarded', 'rejected']),
  notes: z.string().trim().max(2000).optional(),
});

export const linkOwnerBody = z.object({
  userId: z.string().uuid(),
  isPrimary: z.boolean().default(true),
});

export type CreateGymBody = z.infer<typeof createGymBody>;
export type UpdateGymBody = z.infer<typeof updateGymBody>;
export type ListQuery = z.infer<typeof listQuery>;
export type UpdateDemoRequestBody = z.infer<typeof updateDemoRequestBody>;
export type LinkOwnerBody = z.infer<typeof linkOwnerBody>;
