import { z } from 'zod';

export const GeneratePlanSchema = z.object({
  assessmentId: z.string().uuid({ message: 'assessmentId must be a valid UUID' }),
});

export type GeneratePlanDto = z.infer<typeof GeneratePlanSchema>;

export const GetPlanParamsSchema = z.object({
  planId: z.string().uuid({ message: 'planId must be a valid UUID' }),
});
