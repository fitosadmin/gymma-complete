// src/modules/gyms/gyms.schema.ts
import { z } from 'zod';

const boolish = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((v) => v === true || v === 'true');

// allow ?amenities=AC&amenities=Sauna  OR  ?amenities=AC
const stringArray = z
  .union([z.string(), z.array(z.string())])
  .transform((v) => (Array.isArray(v) ? v : [v]))
  .optional();

export const listGymsQuery = z.object({
  q: z.string().trim().min(1).optional(),
  city: z.string().trim().default('Bengaluru'),
  area: z.string().trim().optional(),
  amenities: stringArray,
  women_friendly: boolish.optional(),
  has_parking: boolish.optional(),
  is_open_now: boolish.optional(),
  price_min: z.coerce.number().int().nonnegative().optional(),
  price_max: z.coerce.number().int().nonnegative().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  distance_km: z.coerce.number().positive().max(100).optional(),
  sort: z.enum(['relevance', 'distance', 'rating', 'price_asc']).default('relevance'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(100),
});

export type ListGymsQuery = z.infer<typeof listGymsQuery>;

export const gymSlugParam = z.object({
  slug: z.string().trim().min(1),
});
