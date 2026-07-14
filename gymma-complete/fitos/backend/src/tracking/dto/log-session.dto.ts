import { z } from 'zod';

const SetSchema = z.object({
  setNumber: z.number().int().min(1).max(20),
  reps: z.number().int().min(0).max(200),
  load: z.number().min(0).max(1000).optional(),   // kg; 0 for bodyweight
  rpe: z.number().min(1).max(10).optional(),
  completed: z.boolean().default(true),
});

const ExerciseLogSchema = z.object({
  exerciseId: z.string().uuid(),
  targetSets: z.number().int().min(1).max(20),
  sets: z.array(SetSchema).min(0),
  notes: z.string().max(500).optional(),
});

export const LogSessionSchema = z.object({
  planId: z.string().uuid(),
  dayNumber: z.number().int().min(1).max(14),
  sessionDate: z.string().datetime(),
  status: z.enum(['completed', 'partial', 'missed']),
  durationMinutes: z.number().int().min(1).max(300).optional(),
  rpeAverage: z.number().min(1).max(10).optional(),
  exercises: z.array(ExerciseLogSchema).default([]),
  notes: z.string().max(1000).optional(),
});

export type LogSessionDto = z.infer<typeof LogSessionSchema>;

export const UpdateSessionSchema = z.object({
  status: z.enum(['completed', 'partial', 'missed']).optional(),
  durationMinutes: z.number().int().min(1).max(300).optional(),
  rpeAverage: z.number().min(1).max(10).optional(),
  notes: z.string().max(1000).optional(),
});

export type UpdateSessionDto = z.infer<typeof UpdateSessionSchema>;
