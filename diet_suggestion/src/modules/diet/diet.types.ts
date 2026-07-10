// src/modules/diet/diet.types.ts

export type Gender          = 'male' | 'female' | 'other';
export type Goal            = 'lose_fat' | 'build_muscle' | 'maintain';
export type ActivityKey     = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'athlete';
export type DietaryPattern  = 'omnivore' | 'vegetarian' | 'vegan' | 'keto' | 'no_preference';
export type ExerciseType    = 'resistance' | 'cardio' | 'mixed' | 'none';
export type MedicalCondition = 'none' | 'diabetes_type2' | 'kidney_disease' | 'hypothyroidism' | 'hypertension' | 'pcos' | 'celiac';
export type FoodAllergy     = 'none' | 'dairy' | 'eggs' | 'wheat' | 'peanuts' | 'tree_nuts' | 'soy' | 'fish' | 'shellfish';

export interface DietInput {
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  goal: Goal;
  activityKey: ActivityKey;
  dietaryPattern: DietaryPattern;
  bodyFatPercent?: number;
  exerciseType?: ExerciseType;
  medicalConditions?: MedicalCondition[];
  foodAllergies?: FoodAllergy[];
  cookingTime?: string;
  budgetTier?: string;
  cuisinePreferences?: string[];
}

export interface MacroResult {
  proteinG:   number;
  carbsG:     number;
  fatG:       number;
  proteinCal: number;
  carbsCal:   number;
  fatCal:     number;
}

export interface MealDistribution {
  breakfastCal: number;
  lunchCal:     number;
  dinnerCal:    number;
  snacksCal:    number;
}

export interface DietResult {
  bmr:            number;
  tdee:           number;
  targetCalories: number;
  macros:         MacroResult;
  meals:          MealDistribution;
  notes:          string[];
  warnings:       string[];
}

export interface DietPlanRow {
  id:              string;
  user_id:         string;
  age:             number;
  gender:          string;
  weight_kg:       string;
  height_cm:       string;
  goal:            string;
  activity_key:    string;
  dietary_pattern: string;
  optional_inputs: Record<string, unknown> | null;
  bmr:             number;
  tdee:            number;
  target_calories: number;
  protein_g:       number;
  carbs_g:         number;
  fat_g:           number;
  breakfast_cal:   number;
  lunch_cal:       number;
  dinner_cal:      number;
  snacks_cal:      number;
  notes:           string[];
  warnings:        string[];
  user_note:       string | null;
  label:           string | null;
  created_at:      string;
  deleted_at:      string | null;
}

export interface DietPlanPublic {
  id:             string;
  label:          string | null;
  userNote:       string | null;
  createdAt:      string;
  goal:           Goal;
  activityKey:    ActivityKey;
  dietaryPattern: DietaryPattern;
  weightKg:       number;
  heightCm:       number;
  age:            number;
  gender:         Gender;
  bmr:            number;
  tdee:           number;
  targetCalories: number;
  macros:         MacroResult;
  meals:          MealDistribution;
  notes:          string[];
  warnings:       string[];
}
