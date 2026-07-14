import { z } from 'zod';

export const ExerciseFilterSchema = z.object({
  pattern: z.string().optional(),
  muscle: z.string().optional(),
  equipment: z.string().optional(),
  difficultyMin: z.coerce.number().int().min(0).max(100).optional(),
  difficultyMax: z.coerce.number().int().min(0).max(100).optional(),
  jointComplexity: z.enum(['compound', 'isolation']).optional(),
  experienceMax: z.coerce.number().int().min(0).max(100).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ExerciseFilterDto = z.infer<typeof ExerciseFilterSchema>;
