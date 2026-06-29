// src/modules/owner/owner.schema.ts
import { z } from 'zod';

export const gymIdParam = z.object({
  gymId: z.string().uuid(),
});

export const inquiryIdParam = z.object({
  id: z.string().uuid(),
});

export const listInquiriesQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  status: z.enum(['new', 'contacted', 'joined', 'lost']).optional(),
});

export const updateInquiryBody = z.object({
  status: z.enum(['new', 'contacted', 'joined', 'lost']),
  notes: z.string().trim().max(2000).optional(),
});

const time = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Use HH:MM');

export const updateGymBody = z
  .object({
    description: z.string().trim().max(4000).optional(),
    phone: z.string().trim().max(20).optional(),
    whatsapp: z.string().trim().max(20).optional(),
    addressLine: z.string().trim().max(300).optional(),
    opensAt: time.optional(),
    closesAt: time.optional(),
  })
  .refine((b) => Object.keys(b).length > 0, { message: 'No editable fields provided' });

export type ListInquiriesQuery = z.infer<typeof listInquiriesQuery>;
export type UpdateInquiryBody = z.infer<typeof updateInquiryBody>;
export type UpdateGymBody = z.infer<typeof updateGymBody>;

export const onboardGymBody = z.object({
  description: z.string().trim().max(4000).optional(),
  opensAt: time.optional(),
  closesAt: time.optional(),
  photos: z.array(
    z.object({
      url: z.string().url(),
      caption: z.string().optional(),
    })
  ).optional(),
  amenities: z.array(z.string()).optional(),
  membershipPlans: z.array(
    z.object({
      name: z.string().trim(),
      durationMonths: z.number().int().positive(),
      price: z.number().int().positive(),
    })
  ).optional(),
  trainers: z.array(
    z.object({
      name: z.string().trim(),
      specialization: z.string().trim().optional(),
    })
  ).optional(),
});

export const addMemberBody = z.object({
  fullName: z.string().trim().min(1, 'Name is required'),
  phone: z.string().trim().min(1, 'Phone number is required'),
  email: z.string().trim().email('Invalid email').optional(),
  planId: z.string().uuid().optional(),
});

export type OnboardGymBody = z.infer<typeof onboardGymBody>;
export type AddMemberBody = z.infer<typeof addMemberBody>;
