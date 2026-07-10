// src/broadcast/types/broadcast.schema.ts
import { z } from 'zod';

export const createBroadcastBody = z.object({
  gym_id: z.string().uuid('gym_id must be a valid UUID'),
  title: z.string().trim().min(1, 'title is required').max(255),
  message: z.string().trim().min(1, 'message is required').max(2000),
  type: z.enum(['announcement', 'alert', 'update']).optional().default('announcement'),
  priority: z.enum(['low', 'normal', 'high']).optional().default('normal'),
});
export type CreateBroadcastBody = z.infer<typeof createBroadcastBody>;

export const listBroadcastsQuery = z.object({
  gym_id: z.string().uuid('gym_id must be a valid UUID'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  unread_only: z
    .preprocess((v) => v === 'true' || v === true, z.boolean())
    .optional()
    .default(false),
});
export type ListBroadcastsQuery = z.infer<typeof listBroadcastsQuery>;

export const broadcastIdParams = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});
export type BroadcastIdParams = z.infer<typeof broadcastIdParams>;

export const fcmTokenBody = z.object({
  token: z.string().trim().min(1, 'token is required').max(512),
  platform: z.enum(['ios', 'android']),
  device_id: z.string().trim().max(255).optional(),
});
export type FcmTokenBody = z.infer<typeof fcmTokenBody>;
