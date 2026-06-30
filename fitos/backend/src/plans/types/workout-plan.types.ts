import { UserFitnessProfileVector } from '../../assessment/types/assessment.types';

export type ExerciseCategory = 'warmup' | 'primary' | 'secondary' | 'isolation' | 'conditioning';

export interface ExerciseAssignment {
  exerciseId: string;
  code: string;
  name: string;
  category: ExerciseCategory;
  sets: number;
  reps: number | string;   // number or "8-12" range string
  restSeconds: number;
  rpe?: number;
  intensityPercent1RM?: number;
  notes?: string;
  alternatives?: string[]; // exercise IDs
}

export interface Session {
  dayNumber: number;
  focus: string;           // e.g., "Full Body", "Upper Body", "Push"
  durationMinutes: number;
  exercises: ExerciseAssignment[];
}

export interface ProgramParameters {
  frequency: number;
  split: string;
  weeklyVolumePerMuscle: number;
  intensityModel: IntensityRange;
  periodizationModel: 'double_progression' | 'linear' | 'dup' | 'block';
}

export interface IntensityRange {
  goal: string;
  min1RM: number;
  max1RM: number;
  minRPE?: number;
  maxRPE?: number;
}

export interface ProgressionRules {
  model: 'double_progression' | 'linear' | 'dup' | 'block';
  instructions: string;
  weeklyIncrement?: number;
  deloadWeek?: number;
  mesocycleWeeks?: number;
}

export interface WorkoutPlanOutput {
  planId: string;
  metadata: {
    version: string;
    generatedAt: string;
    userId: string;
    assessmentId: string;
  };
  programParameters: ProgramParameters;
  sessions: Session[];
  progressionRules: ProgressionRules;
  safetyFlags: string[];
  feasibilityWarning?: string;
}

// ── Internal types used during generation ──────────────────────────────────

export type ExerciseWithRelations = {
  id: string;
  code: string;
  name: string;
  displayName: string;
  primaryPattern: string;
  jointComplexity: string;
  difficultyScore: number;
  stabilityDemand: number;
  coordinationComplexity: number;
  mobilityRequired: number;
  injuryRiskFactor: number;
  goalStrength: number;
  goalHypertrophy: number;
  goalEndurance: number;
  goalPower: number;
  experienceMinimum: number;
  muscles: Array<{ muscleId: string; role: string; muscle: { name: string } }>;
  equipment: Array<{ equipmentId: string; equipment: { code: string } }>;
  contraindications: Array<{
    severity: string;
    contraindication: { flag: string };
  }>;
  progressionsTo: Array<{
    fromExercise: { id: string; code: string; difficultyScore: number; mobilityRequired: number };
  }>;
};

export interface ScoredExercise {
  exercise: ExerciseWithRelations;
  matchScore: number;
}

export interface SplitDayConfig {
  day: number;
  focus: string;
  muscleGroups: string[];
  sessionsPerWeekForThisMuscle: number; // how often this group trains per week
}

export interface IntensitySpec {
  min: number;
  max: number;
}

// ── Split muscle group definitions ─────────────────────────────────────────

export const SPLIT_CONFIGS: Record<string, (frequency: number) => SplitDayConfig[]> = {
  'Full Body': (f) =>
    Array.from({ length: f }, (_, i) => ({
      day: i + 1,
      focus: 'Full Body',
      muscleGroups: ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'QUADS', 'HAMSTRINGS', 'GLUTES', 'CORE'],
      sessionsPerWeekForThisMuscle: f,
    })),

  'Upper/Lower': (f) => {
    const days: SplitDayConfig[] = [];
    for (let i = 0; i < f; i++) {
      if (i % 2 === 0) {
        days.push({ day: i + 1, focus: 'Upper Body', muscleGroups: ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS'], sessionsPerWeekForThisMuscle: Math.ceil(f / 2) });
      } else {
        days.push({ day: i + 1, focus: 'Lower Body', muscleGroups: ['QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'CORE'], sessionsPerWeekForThisMuscle: Math.floor(f / 2) });
      }
    }
    return days;
  },

  'Push/Pull/Legs': (f) => {
    const templates: SplitDayConfig[] = [
      { day: 1, focus: 'Push', muscleGroups: ['CHEST', 'SHOULDERS', 'TRICEPS', 'CORE'], sessionsPerWeekForThisMuscle: Math.ceil(f / 3) },
      { day: 2, focus: 'Pull', muscleGroups: ['BACK', 'BICEPS', 'FOREARMS', 'CORE'], sessionsPerWeekForThisMuscle: Math.ceil(f / 3) },
      { day: 3, focus: 'Legs', muscleGroups: ['QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES'], sessionsPerWeekForThisMuscle: Math.ceil(f / 3) },
    ];
    return Array.from({ length: f }, (_, i) => ({ ...templates[i % 3], day: i + 1 }));
  },

  'Bro Split': (_f) => [
    { day: 1, focus: 'Chest & Triceps', muscleGroups: ['CHEST', 'TRICEPS'], sessionsPerWeekForThisMuscle: 1 },
    { day: 2, focus: 'Back & Biceps', muscleGroups: ['BACK', 'BICEPS'], sessionsPerWeekForThisMuscle: 1 },
    { day: 3, focus: 'Shoulders & Traps', muscleGroups: ['SHOULDERS', 'FOREARMS'], sessionsPerWeekForThisMuscle: 1 },
    { day: 4, focus: 'Legs', muscleGroups: ['QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES'], sessionsPerWeekForThisMuscle: 1 },
    { day: 5, focus: 'Arms & Core', muscleGroups: ['BICEPS', 'TRICEPS', 'CORE'], sessionsPerWeekForThisMuscle: 1 },
  ],
};
