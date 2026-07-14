// src/modules/diet/diet.repository.ts
import { query, queryOne } from '../../shared/db/query';
import type { DietInput, DietResult, DietPlanRow, DietPlanPublic } from './diet.types';

function toPublic(row: DietPlanRow): DietPlanPublic {
  return {
    id:             row.id,
    label:          row.label,
    userNote:       row.user_note,
    createdAt:      row.created_at,
    goal:           row.goal as DietPlanPublic['goal'],
    activityKey:    row.activity_key as DietPlanPublic['activityKey'],
    dietaryPattern: row.dietary_pattern as DietPlanPublic['dietaryPattern'],
    weightKg:       parseFloat(row.weight_kg),
    heightCm:       parseFloat(row.height_cm),
    age:            row.age,
    gender:         row.gender as DietPlanPublic['gender'],
    bmr:            row.bmr,
    tdee:           row.tdee,
    targetCalories: row.target_calories,
    macros: {
      proteinG:   row.protein_g,
      carbsG:     row.carbs_g,
      fatG:       row.fat_g,
      proteinCal: row.protein_g * 4,
      carbsCal:   row.carbs_g * 4,
      fatCal:     row.fat_g * 9,
    },
    meals: {
      breakfastCal: row.breakfast_cal,
      lunchCal:     row.lunch_cal,
      dinnerCal:    row.dinner_cal,
      snacksCal:    row.snacks_cal,
    },
    notes:    row.notes    ?? [],
    warnings: row.warnings ?? [],
  };
}

export async function insertDietPlan(
  userId: string,
  input: DietInput,
  result: DietResult,
  label?: string,
): Promise<DietPlanPublic> {
  const optionalInputs = {
    bodyFatPercent:     input.bodyFatPercent    ?? null,
    exerciseType:       input.exerciseType      ?? null,
    medicalConditions:  input.medicalConditions ?? ['none'],
    foodAllergies:      input.foodAllergies     ?? ['none'],
    cookingTime:        input.cookingTime        ?? null,
    budgetTier:         input.budgetTier         ?? null,
    cuisinePreferences: input.cuisinePreferences ?? [],
  };

  const row = await queryOne<DietPlanRow>(
    `INSERT INTO diet_plans (
        user_id, age, gender, weight_kg, height_cm,
        goal, activity_key, dietary_pattern, optional_inputs,
        bmr, tdee, target_calories,
        protein_g, carbs_g, fat_g,
        breakfast_cal, lunch_cal, dinner_cal, snacks_cal,
        notes, warnings, label
      ) VALUES (
        $1,$2,$3,$4,$5, $6,$7,$8,$9,
        $10,$11,$12, $13,$14,$15,
        $16,$17,$18,$19, $20,$21,$22
      ) RETURNING *`,
    [
      userId, input.age, input.gender, input.weightKg, input.heightCm,
      input.goal, input.activityKey, input.dietaryPattern, JSON.stringify(optionalInputs),
      result.bmr, result.tdee, result.targetCalories,
      result.macros.proteinG, result.macros.carbsG, result.macros.fatG,
      result.meals.breakfastCal, result.meals.lunchCal, result.meals.dinnerCal, result.meals.snacksCal,
      result.notes, result.warnings, label ?? null,
    ],
  );
  return toPublic(row!);
}

export async function findPlansByUser(userId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;
  const [countRows, rows] = await Promise.all([
    query<{ count: string }>('SELECT COUNT(*) AS count FROM diet_plans WHERE user_id=$1 AND deleted_at IS NULL', [userId]),
    query<DietPlanRow>('SELECT * FROM diet_plans WHERE user_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT $2 OFFSET $3', [userId, limit, offset]),
  ]);
  return { plans: rows.map(toPublic), total: parseInt(countRows[0]?.count ?? '0', 10) };
}

export async function findPlanById(id: string, userId: string) {
  const row = await queryOne<DietPlanRow>('SELECT * FROM diet_plans WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL', [id, userId]);
  return row ? toPublic(row) : null;
}

export async function findActivePlan(userId: string) {
  const row = await queryOne<DietPlanRow>('SELECT * FROM diet_plans WHERE user_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1', [userId]);
  return row ? toPublic(row) : null;
}

export async function updatePlanNote(id: string, userId: string, userNote?: string | null, label?: string | null) {
  const row = await queryOne<DietPlanRow>(
    `UPDATE diet_plans SET user_note=COALESCE($3,user_note), label=COALESCE($4,label)
     WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL RETURNING *`,
    [id, userId, userNote ?? null, label ?? null],
  );
  return row ? toPublic(row) : null;
}

export async function softDeletePlan(id: string, userId: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    'UPDATE diet_plans SET deleted_at=NOW() WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL RETURNING id',
    [id, userId],
  );
  return rows.length > 0;
}
