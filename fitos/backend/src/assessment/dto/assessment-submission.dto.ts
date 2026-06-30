import { z } from 'zod';

const GoalEnum = z.enum(['Strength', 'Hypertrophy', 'Endurance', 'Power', 'General_Health', 'Recomposition']);

export const AssessmentSubmissionSchema = z.object({
  // ── Section 0: Safety Screening ──────────────────────────────────────────
  S0_Q1: z.boolean(),
  S0_Q2: z.boolean(),
  S0_Q3: z.boolean(),
  S0_Q4: z.boolean(),
  S0_Q5: z.boolean(),
  S0_Q6: z.boolean().optional(),
  S0_Q7: z.boolean(),

  // ── Section 1: Identity & Body ───────────────────────────────────────────
  S1_AGE:              z.number().int().min(15).max(90),
  S1_SEX:              z.enum(['M', 'F', 'Other']),
  S1_HEIGHT:           z.number().positive(),
  S1_WEIGHT:           z.number().positive(),
  S1_BODYFAT:          z.number().min(3).max(60).optional(),
  S1_GOAL_WEIGHT:      z.number().positive().optional(),
  S1_BODY_COMP_GOAL:   z.enum(['Lose fat', 'Build muscle', 'Recomposition', 'Maintain', 'Performance']),

  // ── Section 2: Recovery Capacity ─────────────────────────────────────────
  S2_SLEEP:            z.number().min(3).max(12),
  S2_SLEEP_QUALITY:    z.number().int().min(1).max(5),
  S2_STRESS:           z.enum(['Low', 'Med', 'High']),
  S2_OCCUPATION:       z.enum(['Sedentary', 'Light', 'Active', 'Very_Active']),
  S2_ALCOHOL:          z.number().int().min(0).max(21).optional(),
  S2_NUTRITION:        z.enum(['Poor', 'Inconsistent', 'Consistent', 'Strict']),

  // ── Section 3: Training History ──────────────────────────────────────────
  S3_DURATION:         z.enum(['Never', '<6mo', '6-12mo', '1-2yr', '2-5yr', '5+yr']),
  S3_COMPOUNDS:        z.array(z.enum(['Squat', 'Deadlift', 'Bench Press', 'Overhead Press', 'Pull-up'])),
  S3_PROGRAM:          z.boolean(),
  S3_FREQUENCY:        z.number().int().min(0).max(21),
  S3_1RM_AWARE:        z.boolean().optional(),
  S3_SQUAT_1RM:        z.number().positive().optional(),
  S3_DEADLIFT_1RM:     z.number().positive().optional(),
  S3_BENCH_1RM:        z.number().positive().optional(),

  // ── Section 4: Goal Specification ────────────────────────────────────────
  S4_PRIMARY:          GoalEnum,
  S4_SECONDARY:        GoalEnum.optional(),
  S4_TIMELINE:         z.enum(['4', '8', '12', '16', '20+']),
  S4_TARGET_AREAS:     z.array(z.string()).optional(),

  // ── Section 5: Availability ──────────────────────────────────────────────
  S5_DAYS:             z.number().int().min(1).max(7),
  S5_TIME:             z.number().int().min(15).max(120),
  S5_GYM_TYPE:         z.enum(['Home', 'Commercial', 'Outdoor']),
  S5_SCHEDULE:         z.array(z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])).optional(),

  // ── Section 6: Injury & Medical ──────────────────────────────────────────
  S6_CURRENT_INJURY:   z.boolean(),
  S6_INJURY_LIST:      z.array(z.string()).optional(),
  S6_PAIN_SCALE:       z.number().int().min(0).max(10).optional(),
  S6_PAST_SURGERY:     z.boolean(),
  S6_PHYSIO:           z.boolean(),

  // ── Section 7: Mobility (conditional) ────────────────────────────────────
  S7_SQUAT_DEPTH:      z.enum(['Yes', 'No', 'Only with raised heels']).optional(),
  S7_OVERHEAD:         z.enum(['Yes', 'No', 'Partial']).optional(),
  S7_HINGE:            z.enum(['Yes', 'No', 'Almost']).optional(),
  S7_LUNGE:            z.enum(['Yes', 'No', 'Unstable']).optional(),
  S7_ROTARY:           z.enum(['Yes', 'No', 'Limited']).optional(),

  // ── Section 8: Preferences (conditional) ─────────────────────────────────
  S8_STYLE:            z.enum(['Free Weights', 'Machines', 'Calisthenics', 'Mixed']).optional(),
  S8_SPLIT:            z.enum(['Full Body', 'Upper/Lower', 'Push/Pull/Legs', 'Bro Split', 'Specialized', 'Custom']).optional(),
  S8_CARDIO:           z.enum(['None', 'Low', 'Moderate', 'High']).optional(),
  S8_DISLIKES:         z.array(z.string()).optional(),
  S8_RPE:              z.enum(['RPE', '%1RM', 'Neither']).optional(),
}).superRefine((data, ctx) => {
  // Secondary goal must differ from primary
  if (data.S4_SECONDARY && data.S4_SECONDARY === data.S4_PRIMARY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['S4_SECONDARY'],
      message: 'Secondary goal must differ from primary goal',
    });
  }

  // 1RM fields only valid when S3_1RM_AWARE = true
  if (!data.S3_1RM_AWARE) {
    if (data.S3_SQUAT_1RM !== undefined || data.S3_DEADLIFT_1RM !== undefined || data.S3_BENCH_1RM !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['S3_1RM_AWARE'],
        message: '1RM fields require S3_1RM_AWARE to be true',
      });
    }
  }

  // S6_INJURY_LIST and S6_PAIN_SCALE required when S6_CURRENT_INJURY = true
  if (data.S6_CURRENT_INJURY) {
    if (!data.S6_INJURY_LIST || data.S6_INJURY_LIST.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['S6_INJURY_LIST'],
        message: 'Injury list required when current injury is true',
      });
    }
    if (data.S6_PAIN_SCALE === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['S6_PAIN_SCALE'],
        message: 'Pain scale required when current injury is true',
      });
    }
  }
});

export type AssessmentSubmissionDto = z.infer<typeof AssessmentSubmissionSchema>;
