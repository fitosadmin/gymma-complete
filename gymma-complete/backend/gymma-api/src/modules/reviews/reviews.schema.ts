// src/modules/reviews/reviews.schema.ts
import { z } from 'zod';

export const listReviewsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  sort: z.enum(['recent', 'helpful']).default('recent'),
});

export type ListReviewsQuery = z.infer<typeof listReviewsQuery>;
