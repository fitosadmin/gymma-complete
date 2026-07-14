// src/modules/diet/diet.schema.ts
import { z } from 'zod';

const goal            = z.enum(['lose_fat', 'build_muscle', 'maintain']);
const activityKey     = z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'athlete']);
const dietaryPattern  = z.enum(['omnivore', 'vegetarian', 'vegan', 'keto', 'no_preference']);
const exerciseType    = z.enum(['resistance', 'cardio', 'mixed', 'none']);
const medicalCondition = z.enum(['none', 'diabetes_type2', 'kidney_disease', 'hypothyroidism', 'hypertension', 'pcos', 'celiac']);
const foodAllergy     = z.enum(['none', 'dairy', 'eggs', 'wheat', 'peanuts', 'tree_nuts', 'soy', 'fish', 'shellfish']);

export const calculateBody = z.object({
  age:            z.number().int().min(13).max(120),
  gender:         z.enum(['male', 'female', 'other']),
  weightKg:       z.number().positive().max(500),
  heightCm:       z.number().positive().max(300),
  goal,
  activityKey,
  dietaryPattern,
  bodyFatPercent: z.number().min(3).max(70).optional(),
  exerciseType:   exerciseType.optional(),
  medicalConditions: z.array(medicalCondition).optional(),
  foodAllergies:  z.array(foodAllergy).optional(),
  cookingTime:    z.string().max(50).optional(),
  budgetTier:     z.enum(['economy', 'moderate', 'premium']).optional(),
  cuisinePreferences: z.array(z.string().max(50)).max(10).optional(),
  label:          z.string().trim().max(100).optional(),
});

export const updateNoteBody = z.object({
  userNote: z.string().trim().max(1000).optional().nullable(),
  label:    z.string().trim().max(100).optional().nullable(),
});

export const planParams = z.object({
  id: z.string().uuid('Plan ID must be a valid UUID'),
});

export const listQuery = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type CalculateBody  = z.infer<typeof calculateBody>;
export type UpdateNoteBody = z.infer<typeof updateNoteBody>;
export type PlanParams     = z.infer<typeof planParams>;
export type ListQuery      = z.infer<typeof listQuery>;
