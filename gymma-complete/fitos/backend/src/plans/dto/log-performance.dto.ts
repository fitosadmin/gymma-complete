import { z } from 'zod';

export const LogPerformanceSchema = z.object({
  exerciseId: z.string().uuid(),
  sets: z.number().int().min(1).max(20),
  reps: z.number().int().min(0).max(200),
  load: z.number().min(0).max(1000).optional(),
  rpe: z.number().min(1).max(10).optional(),
  notes: z.string().max(500).optional(),
});

export type LogPerformanceDto = z.infer<typeof LogPerformanceSchema>;
