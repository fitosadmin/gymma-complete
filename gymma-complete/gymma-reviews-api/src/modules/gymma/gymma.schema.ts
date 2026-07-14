// src/modules/gymma/gymma.schema.ts
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------
export const gymIdQuery = z.object({
  gym_id: z.string().min(1, 'gym_id is required'),
});
export type GymIdQuery = z.infer<typeof gymIdQuery>;

// ---------------------------------------------------------------------------
// Poll submission
// ---------------------------------------------------------------------------
export const submitPollBody = z.object({
  gym_id: z.string().min(1, 'gym_id is required'),
  responses: z.record(z.string(), z.number()),
  submission_time_ms: z.number().int().positive().optional(),
});
export type SubmitPollBody = z.infer<typeof submitPollBody>;

// ---------------------------------------------------------------------------
// Public: leaderboard + history
// ---------------------------------------------------------------------------
export const leaderboardQuery = z.object({
  tier_min: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});
export type LeaderboardQuery = z.infer<typeof leaderboardQuery>;

export const historyQuery = z.object({
  gym_id: z.string().min(1),
  days: z.coerce.number().min(1).max(365).default(30),
});
export type HistoryQuery = z.infer<typeof historyQuery>;

// ---------------------------------------------------------------------------
// Admin: recalculate
// ---------------------------------------------------------------------------
export const recalculateBody = z
  .object({
    gym_id: z.string().optional(),
    all: z.boolean().optional(),
  })
  .refine((d) => d.gym_id || d.all, {
    message: 'Either gym_id or all=true is required',
  });
export type RecalculateBody = z.infer<typeof recalculateBody>;

// ---------------------------------------------------------------------------
// Admin: dimension weight update
// ---------------------------------------------------------------------------
export const updateDimensionWeightBody = z.object({
  weight: z.number().min(0).max(1),
});
export type UpdateDimensionWeightBody = z.infer<typeof updateDimensionWeightBody>;

export const dimensionKeyParam = z.object({
  key: z.string().min(1),
});
export type DimensionKeyParam = z.infer<typeof dimensionKeyParam>;

// ---------------------------------------------------------------------------
// Admin: submission moderation
// ---------------------------------------------------------------------------
export const submissionsListQuery = z.object({
  gym_id: z.string().optional(),
  flagged_only: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});
export type SubmissionsListQuery = z.infer<typeof submissionsListQuery>;

export const submissionIdParam = z.object({
  id: z.string().min(1),
});
export type SubmissionIdParam = z.infer<typeof submissionIdParam>;
