// src/modules/diet/diet.calculator.ts
// Pure math — no DB, no Express deps.
// All formulas sourced from New document 2.json.

import type { DietInput, DietResult, MacroResult, MealDistribution } from './diet.types';

export const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary:          1.2,
  lightly_active:     1.375,
  moderately_active:  1.55,
  very_active:        1.725,
  athlete:            1.9,
};

export function calculateDiet(input: DietInput): DietResult {
  const notes: string[]    = [];
  const warnings: string[] = [];

  // Step 1: BMR (Mifflin-St Jeor)
  let bmr = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  bmr += input.gender === 'male' ? 5 : -161;

  // Step 2: TDEE
  const multiplier = ACTIVITY_MULTIPLIERS[input.activityKey] ?? 1.55;
  let tdee = bmr * multiplier;

  if (input.medicalConditions?.includes('hypothyroidism')) {
    tdee *= 0.9;
    warnings.push('Hypothyroidism: Calorie target reduced by 10%. Prioritise selenium & iodine-rich foods.');
  }

  // Step 3: Target Calories
  let targetCals = tdee;
  switch (input.goal) {
    case 'lose_fat':     targetCals -= 500; break;
    case 'build_muscle': targetCals += 300; break;
  }
  targetCals = Math.max(1000, Math.min(6000, targetCals));

  // Step 4: Macros
  const isKeto    = input.dietaryPattern === 'keto';
  const hasKidney = input.medicalConditions?.includes('kidney_disease') ?? false;
  const leanMass  = input.bodyFatPercent != null
    ? input.weightKg * (1 - input.bodyFatPercent / 100)
    : input.weightKg;

  let protein: number, carbs: number, fat: number;

  if (isKeto) {
    carbs   = 30;
    protein = 1.6 * input.weightKg;
    fat     = (targetCals - protein * 4 - carbs * 4) / 9;
    notes.push('Keto mode: Carbs fixed at 30g net. Fat fills remaining calories.');
  } else {
    switch (input.goal) {
      case 'lose_fat':
        protein = input.bodyFatPercent != null ? 2.4 * leanMass : 2.2 * input.weightKg;
        break;
      case 'build_muscle':
        protein = 1.8 * input.weightKg;
        break;
      default:
        protein = 1.6 * input.weightKg;
    }

    const ex = input.exerciseType ?? 'none';
    if (ex === 'resistance') {
      protein += 0.2 * input.weightKg;
      notes.push('Resistance training: +0.2g/kg protein added.');
    } else if (ex === 'cardio') {
      notes.push('Cardio training: +0.5g/kg carbs added.');
    }

    fat = 0.8 * input.weightKg;
    carbs = (targetCals - protein * 4 - fat * 9) / 4;
    if (ex === 'cardio') carbs += 0.5 * input.weightKg;
  }

  // Medical overrides
  if (hasKidney) {
    const cap = 0.8 * input.weightKg;
    if (protein > cap) {
      protein = cap;
      if (!isKeto) carbs = (targetCals - protein * 4 - fat! * 9) / 4;
      warnings.push('Kidney disease: Protein capped at 0.8g/kg. Consult a nephrologist.');
    }
  }

  if (input.medicalConditions?.includes('diabetes_type2'))
    warnings.push('Type 2 Diabetes: Limit carbs to ~60g per meal. Choose low-GI foods.');
  if (input.medicalConditions?.includes('hypertension'))
    warnings.push('Hypertension: Limit sodium to 2,300mg/day. Follow DASH diet principles.');
  if (input.medicalConditions?.includes('pcos'))
    notes.push('PCOS: A low-GI, high-protein diet may help. Consider a registered dietitian.');
  if (input.medicalConditions?.includes('celiac'))
    notes.push('Celiac: Strictly avoid gluten (wheat, barley, rye).');

  if (input.dietaryPattern === 'vegan')
    notes.push('Vegan: Combine diverse plant proteins. Supplement B12 and algae-based Omega-3.');
  else if (input.dietaryPattern === 'vegetarian')
    notes.push('Vegetarian: Eggs, dairy, and legumes are great protein sources.');

  if (!isKeto && carbs < 20) {
    carbs = 20;
    warnings.push('Calorie target is very aggressive. Consider a smaller deficit.');
  }

  const tCal  = Math.round(targetCals);
  const protG = clamp(Math.round(protein), 0, 500);
  const carbG = clamp(Math.round(carbs!),  0, 800);
  const fatG  = clamp(Math.round(fat!),    10, 300);

  const macros: MacroResult = {
    proteinG: protG, carbsG: carbG, fatG,
    proteinCal: protG * 4, carbsCal: carbG * 4, fatCal: fatG * 9,
  };

  const meals: MealDistribution = {
    breakfastCal: Math.round(tCal * 0.25),
    lunchCal:     Math.round(tCal * 0.35),
    dinnerCal:    Math.round(tCal * 0.30),
    snacksCal:    Math.round(tCal * 0.10),
  };

  return { bmr: Math.round(bmr), tdee: Math.round(tdee), targetCalories: tCal, macros, meals, notes, warnings };
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
