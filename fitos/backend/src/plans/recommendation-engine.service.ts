import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExerciseMatcherService } from './exercise-matcher.service';
import { VectorComputationService } from '../assessment/vector-computation.service';
import { AssessmentResponses, UserFitnessProfileVector } from '../assessment/types/assessment.types';
import {
  ExerciseWithRelations,
  ScoredExercise,
  Session,
  ExerciseAssignment,
  IntensityRange,
  ProgressionRules,
  WorkoutPlanOutput,
  SPLIT_CONFIGS,
  SplitDayConfig,
} from './types/workout-plan.types';

// ─── Intensity table: Doc 3 §4.2 — 6 goals × 3 experience tiers ─────────────

const INTENSITY_TABLE: Record<string, { novice: IntensityRange; intermediate: IntensityRange; advanced: IntensityRange }> = {
  Strength:     { novice: { goal: 'Strength',     min1RM: 70, max1RM: 80, minRPE: 8, maxRPE: 9 }, intermediate: { goal: 'Strength',     min1RM: 80, max1RM: 90, minRPE: 8, maxRPE: 9 }, advanced: { goal: 'Strength',     min1RM: 85, max1RM: 95, minRPE: 9, maxRPE: 10 } },
  Hypertrophy:  { novice: { goal: 'Hypertrophy',  min1RM: 65, max1RM: 75, minRPE: 7, maxRPE: 8 }, intermediate: { goal: 'Hypertrophy',  min1RM: 70, max1RM: 80, minRPE: 7, maxRPE: 8 }, advanced: { goal: 'Hypertrophy',  min1RM: 75, max1RM: 85, minRPE: 8, maxRPE: 9 } },
  Endurance:    { novice: { goal: 'Endurance',    min1RM: 50, max1RM: 60, minRPE: 6, maxRPE: 7 }, intermediate: { goal: 'Endurance',    min1RM: 55, max1RM: 65, minRPE: 6, maxRPE: 7 }, advanced: { goal: 'Endurance',    min1RM: 60, max1RM: 70, minRPE: 7, maxRPE: 8 } },
  Power:        { novice: { goal: 'Power',        min1RM: 60, max1RM: 70, minRPE: 7, maxRPE: 8 }, intermediate: { goal: 'Power',        min1RM: 60, max1RM: 70, minRPE: 7, maxRPE: 8 }, advanced: { goal: 'Power',        min1RM: 75, max1RM: 85, minRPE: 8, maxRPE: 9 } },
  General_Health:{ novice: { goal: 'General_Health', min1RM: 60, max1RM: 70, minRPE: 6, maxRPE: 7 }, intermediate: { goal: 'General_Health', min1RM: 65, max1RM: 75, minRPE: 7, maxRPE: 8 }, advanced: { goal: 'General_Health', min1RM: 70, max1RM: 80, minRPE: 7, maxRPE: 8 } },
  Recomposition: { novice: { goal: 'Recomposition', min1RM: 65, max1RM: 75, minRPE: 7, maxRPE: 8 }, intermediate: { goal: 'Recomposition', min1RM: 70, max1RM: 80, minRPE: 7, maxRPE: 8 }, advanced: { goal: 'Recomposition', min1RM: 75, max1RM: 85, minRPE: 8, maxRPE: 9 } },
};

// ─── Split matrix: Doc 3 §4.4 ─────────────────────────────────────────────

const SPLIT_MATRIX: Record<number, Record<string, string>> = {
  1: { '<20': 'Full Body', '20-40': 'Full Body', '40-60': 'Full Body', '>60': 'Full Body' },
  2: { '<20': 'Full Body', '20-40': 'Full Body', '40-60': 'Full Body', '>60': 'Upper/Lower' },
  3: { '<20': 'Full Body', '20-40': 'Full Body', '40-60': 'Full Body', '>60': 'Push/Pull/Legs' },
  4: { '<20': 'Full Body', '20-40': 'Upper/Lower', '40-60': 'Upper/Lower', '>60': 'Upper/Lower' },
  5: { '<20': 'Full Body', '20-40': 'Upper/Lower', '40-60': 'Push/Pull/Legs', '>60': 'Push/Pull/Legs' },
  6: { '<20': 'Full Body', '20-40': 'Upper/Lower', '40-60': 'Push/Pull/Legs', '>60': 'Bro Split' },
};

// Rep ranges by goal and category — Doc 3 §4.5
const REP_RANGES: Record<string, Record<string, { sets: number; reps: string; rest: number }>> = {
  Strength:      { primary: { sets: 4, reps: '3-5', rest: 240 }, secondary: { sets: 3, reps: '5-8', rest: 180 }, isolation: { sets: 3, reps: '8-12', rest: 90 } },
  Hypertrophy:   { primary: { sets: 4, reps: '6-12', rest: 120 }, secondary: { sets: 3, reps: '8-12', rest: 90 }, isolation: { sets: 3, reps: '10-15', rest: 60 } },
  Endurance:     { primary: { sets: 3, reps: '15-20', rest: 60 }, secondary: { sets: 3, reps: '15-20', rest: 45 }, isolation: { sets: 3, reps: '20-25', rest: 30 } },
  Power:         { primary: { sets: 5, reps: '1-5', rest: 300 }, secondary: { sets: 3, reps: '6-10', rest: 120 }, isolation: { sets: 3, reps: '8-12', rest: 90 } },
  General_Health:{ primary: { sets: 3, reps: '10-15', rest: 90 }, secondary: { sets: 3, reps: '12-15', rest: 75 }, isolation: { sets: 3, reps: '12-20', rest: 60 } },
  Recomposition: { primary: { sets: 4, reps: '8-12', rest: 90 }, secondary: { sets: 3, reps: '10-15', rest: 75 }, isolation: { sets: 3, reps: '12-15', rest: 60 } },
};

@Injectable()
export class RecommendationEngineService {
  constructor(
    private prisma: PrismaService,
    private matcher: ExerciseMatcherService,
    private vectorService: VectorComputationService,
  ) {}

  // ─── 10-Step Pipeline (Doc 3 §7) ─────────────────────────────────────────

  async generatePlan(assessmentId: string, userId: string): Promise<WorkoutPlanOutput> {
    // STEP 1 — Ingest User Vector U
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, userId },
      include: { user: true },
    });
    if (!assessment) {
      throw new BadRequestException({ errorCode: 'ASSESSMENT_NOT_FOUND', message: 'Assessment not found' });
    }

    const U = assessment.computedVector as unknown as UserFitnessProfileVector;
    const responses = assessment.responses as unknown as AssessmentResponses;
    const safetyFlags = assessment.safetyFlags as unknown as string[];

    // Block plan generation if medical clearance required
    if (safetyFlags.includes('MEDICAL_CLEARANCE_REQUIRED')) {
      throw new BadRequestException({
        errorCode: 'MEDICAL_CLEARANCE_REQUIRED',
        message: 'Cannot generate load-bearing plan. Medical clearance required.',
      });
    }

    // Edge case 6.4: High Injury Risk
    const highInjuryRisk = U.Injury_Risk > 60;

    // Edge case 6.5: Pregnancy/Postpartum
    const isPregnant = safetyFlags.includes('PREGNANCY_POSTPARTUM');

    // Edge case 6.6: Over 65
    const over65 = responses.S1_AGE > 65;

    // STEP 2 — Load Gym Exercise Database
    const gymId = assessment.user.gymId ?? 'default-gym-000000000000';
    const gymDbRecords = await this.prisma.gymExerciseDatabase.findMany({
      where: { gymId, isAvailable: true },
      include: {
        exercise: {
          include: {
            muscles: { include: { muscle: true } },
            equipment: { include: { equipment: true } },
            contraindications: { include: { contraindication: true } },
            progressionsTo: {
              include: {
                fromExercise: { select: { id: true, code: true, difficultyScore: true, mobilityRequired: true } },
              },
            },
          },
        },
      },
    });

    let gymExercises = gymDbRecords.map((r) => r.exercise) as unknown as ExerciseWithRelations[];

    // Edge case 6.4 modifier: cap difficulty at ≤30 for high injury risk
    if (highInjuryRisk) {
      gymExercises = gymExercises.filter((e) => e.difficultyScore <= 30);
    }

    // Edge case 6.5 modifier: pregnancy blacklists
    if (isPregnant) {
      gymExercises = gymExercises.filter((e) => {
        const hasPregnancyContra = e.contraindications.some(
          (c) => c.contraindication.flag === 'PREGNANCY_POSTPARTUM',
        );
        return !hasPregnancyContra && e.mobilityRequired <= 60;
      });
    }

    // Edge case 6.6 modifier: over 65 prefers machine/BW
    if (over65) {
      const preferred = gymExercises.filter((e) =>
        e.equipment.some((eq) => ['MACHINE', 'BW', 'CABLE', 'BAND'].includes(eq.equipment.code)),
      );
      gymExercises = preferred.length >= 10 ? preferred : gymExercises;
    }

    // STEP 3 + 4 — Apply Hard Filters and Compute Match Scores
    let scoredExercises = await this.matcher.filterAndScore(gymExercises, U, responses);

    // Edge case 6.1: No exercises after filtering
    if (scoredExercises.length === 0) {
      scoredExercises = await this.fallbackToBodyweight(U, responses);
    }

    if (scoredExercises.length === 0) {
      throw new BadRequestException({
        errorCode: 'MOBILITY_ONLY_PLAN',
        message:
          'Your current constraints limit resistance training. This plan focuses on movement quality ' +
          'and pain-free range of motion. Please consult a medical professional before adding load.',
      });
    }

    // STEP 5 — Determine Program Parameters
    const F = this.calculateFrequency(U.Availability_Score, U.Recovery_Capacity, responses.S5_DAYS);
    const V = this.calculateVolume(U.Experience_Score, U.Recovery_Capacity);

    // Edge case 6.4: reduce volume 30% for high injury risk
    const adjustedV = highInjuryRisk ? V * 0.70 : V;

    // Edge case 6.5: cap intensity at 70% 1RM for pregnancy
    const intensityRange = this.calculateIntensity(responses.S4_PRIMARY, U.Experience_Score);
    if (isPregnant) {
      intensityRange.max1RM = Math.min(intensityRange.max1RM, 70);
      intensityRange.maxRPE = Math.min(intensityRange.maxRPE ?? 10, 7);
    }

    // Edge case 6.2: Feasibility check
    const feasibilityWarning = this.checkFeasibility(U, responses);

    const split = this.selectSplit(F, U.Experience_Score, responses.S8_SPLIT);
    const periodizationModel = this.selectPeriodizationModel(U.Experience_Score);

    // STEP 6 — Allocate Volume to Muscle Groups (via split config)
    const splitConfig = SPLIT_CONFIGS[split]?.(F) ?? SPLIT_CONFIGS['Full Body'](F);

    // STEP 7 + 8 — Select Exercises and Assign Sets/Reps/Rest/RPE
    const sessions = this.buildSessions(
      scoredExercises,
      splitConfig,
      adjustedV,
      responses,
      U,
      intensityRange,
      highInjuryRisk,
      over65,
    );

    // Generate safety flags for plan output
    const planSafetyFlags = [...safetyFlags];
    if (highInjuryRisk) planSafetyFlags.push('HIGH_INJURY_RISK_MODIFICATIONS_APPLIED');
    if (isPregnant) planSafetyFlags.push('PREGNANCY_MODIFICATIONS_APPLIED');
    if (over65) planSafetyFlags.push('SENIOR_MODIFICATIONS_APPLIED');
    if (feasibilityWarning) planSafetyFlags.push('FEASIBILITY_WARNING');

    // STEP 9 — Build Output JSON
    const planOutput: WorkoutPlanOutput = {
      planId: '', // filled after DB save
      metadata: {
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        userId,
        assessmentId,
      },
      programParameters: {
        frequency: F,
        split,
        weeklyVolumePerMuscle: adjustedV,
        intensityModel: intensityRange,
        periodizationModel,
      },
      sessions,
      progressionRules: this.getProgressionRules(U.Experience_Score, periodizationModel),
      safetyFlags: planSafetyFlags,
      ...(feasibilityWarning ? { feasibilityWarning } : {}),
    };

    // STEP 10 — Store and Track
    const saved = await this.prisma.workoutPlan.create({
      data: {
        assessmentId,
        userId,
        metadata: planOutput.metadata as any,
        programParameters: planOutput.programParameters as any,
        sessions: planOutput.sessions as any,
        progressionRules: planOutput.progressionRules as any,
        safetyFlags: planOutput.safetyFlags as any,
      },
    });

    planOutput.planId = saved.id;
    return planOutput;
  }

  // ─── Step 5: Program Parameters ──────────────────────────────────────────

  // Doc 3 §4.3 — F = min(floor(A*7/100), RECOVERY_LIMIT(R), S5_DAYS)
  calculateFrequency(A: number, R: number, requestedDays: number): number {
    const maxFromAvailability = Math.floor((A * 7) / 100);

    let recoveryLimit: number;
    if (R < 30) recoveryLimit = 2;
    else if (R < 50) recoveryLimit = 3;
    else if (R < 70) recoveryLimit = 4;
    else if (R < 85) recoveryLimit = 5;
    else recoveryLimit = 6;

    return Math.max(1, Math.min(maxFromAvailability, recoveryLimit, requestedDays));
  }

  // Doc 3 §4.1 — BASE_VOLUME by experience tier, modified by recovery
  calculateVolume(E: number, R: number): number {
    let base: number;
    if (E < 20) base = 10;
    else if (E < 40) base = 12;
    else if (E < 60) base = 15;
    else if (E <= 80) base = 18;
    else base = 20;

    return base * (R / 100);
  }

  // Doc 3 §4.2 — Intensity range by goal and experience tier
  calculateIntensity(goal: string, E: number): IntensityRange {
    const tier = E < 20 ? 'novice' : E < 60 ? 'intermediate' : 'advanced';
    const table = INTENSITY_TABLE[goal];
    if (!table) return INTENSITY_TABLE['General_Health'][tier];
    return { ...table[tier] };
  }

  // Doc 3 §4.4 — Split selection matrix (24 combinations)
  selectSplit(F: number, E: number, preferredSplit?: string): string {
    const clampedF = Math.min(6, Math.max(1, F));
    const expTier = E < 20 ? '<20' : E < 40 ? '20-40' : E < 60 ? '40-60' : '>60';

    const matrixSplit = SPLIT_MATRIX[clampedF]?.[expTier] ?? 'Full Body';

    // Validate user's preferred split against matrix
    if (preferredSplit && SPLIT_CONFIGS[preferredSplit]) {
      const preferredDaysNeeded = Object.keys(SPLIT_CONFIGS[preferredSplit](F)).length;
      if (preferredSplit === matrixSplit || preferredDaysNeeded <= F) {
        return preferredSplit;
      }
      // Incompatible preference — use matrix value (frontend should show warning)
    }

    return matrixSplit;
  }

  // ─── Step 6 + 7 + 8: Build Sessions ─────────────────────────────────────

  private buildSessions(
    scoredExercises: ScoredExercise[],
    splitConfig: SplitDayConfig[],
    weeklyVolume: number,
    responses: AssessmentResponses,
    U: UserFitnessProfileVector,
    intensity: IntensityRange,
    highInjuryRisk: boolean,
    over65: boolean,
  ): Session[] {
    const goal = responses.S4_PRIMARY;
    const repRangeTemplate = REP_RANGES[goal] ?? REP_RANGES['General_Health'];
    const useRPE = responses.S8_RPE === 'RPE';

    return splitConfig.map((dayConfig) => {
      const setsPerMuscleThisSession = Math.max(2, Math.round(weeklyVolume / dayConfig.sessionsPerWeekForThisMuscle));

      // Filter scored exercises to those that target this day's muscle groups
      const dayTargetMuscles = new Set(dayConfig.muscleGroups.map((m) => m.toUpperCase()));

      const dayExercises = scoredExercises.filter((se) =>
        se.exercise.muscles.some((em) => dayTargetMuscles.has(em.muscle.name.toUpperCase()) && em.role === 'primary'),
      );

      const assignments: ExerciseAssignment[] = [];
      const usedPatterns = new Set<string>();
      const usedExerciseIds = new Set<string>();

      // Warm-up: 1 exercise per movement pattern present in this day, very low intensity
      const warmupExercises = dayExercises
        .filter((se) => se.exercise.difficultyScore <= 20 && !usedExerciseIds.has(se.exercise.id))
        .slice(0, 2);

      for (const { exercise } of warmupExercises) {
        assignments.push({
          exerciseId: exercise.id,
          code: exercise.code,
          name: exercise.name,
          category: 'warmup',
          sets: 2,
          reps: '10-15',
          restSeconds: 60,
          notes: 'Warm-up: 50% of working weight',
        });
        usedExerciseIds.add(exercise.id);
      }

      // Primary Compound (1-2): highest match score compound, covers most target muscles
      const primaryCandidates = dayExercises
        .filter((se) =>
          se.exercise.jointComplexity === 'compound' &&
          !usedExerciseIds.has(se.exercise.id) &&
          !usedPatterns.has(se.exercise.primaryPattern),
        )
        .slice(0, 2);

      for (const { exercise } of primaryCandidates) {
        const spec = repRangeTemplate.primary;
        const assignment = this.buildAssignment(exercise, 'primary', spec, intensity, useRPE, highInjuryRisk, over65);
        assignments.push(assignment);
        usedExerciseIds.add(exercise.id);
        usedPatterns.add(exercise.primaryPattern);
      }

      // Secondary Compound / Accessory (2-3): different patterns from primary
      const secondaryCandidates = dayExercises
        .filter((se) =>
          se.exercise.jointComplexity === 'compound' &&
          !usedExerciseIds.has(se.exercise.id),
        )
        .slice(0, 3);

      for (const { exercise } of secondaryCandidates) {
        const spec = repRangeTemplate.secondary;
        assignments.push(this.buildAssignment(exercise, 'secondary', spec, intensity, useRPE, highInjuryRisk, over65));
        usedExerciseIds.add(exercise.id);
      }

      // Isolation / Prehab (2-3): isolation exercises for target muscles
      const isolationCandidates = dayExercises
        .filter((se) =>
          se.exercise.jointComplexity === 'isolation' &&
          !usedExerciseIds.has(se.exercise.id),
        )
        .slice(0, 3);

      // Edge case 6.4: Add 2 prehab exercises for high injury risk
      const prehab = highInjuryRisk
        ? scoredExercises
            .filter((se) => se.exercise.difficultyScore <= 15 && !usedExerciseIds.has(se.exercise.id))
            .slice(0, 2)
        : [];

      for (const { exercise } of [...isolationCandidates, ...prehab]) {
        const spec = repRangeTemplate.isolation;
        assignments.push(this.buildAssignment(exercise, 'isolation', spec, intensity, useRPE, highInjuryRisk, over65));
        usedExerciseIds.add(exercise.id);
      }

      // Conditioning (optional, based on S8_CARDIO)
      const conditioning = this.buildConditioningBlock(responses.S8_CARDIO);
      if (conditioning) assignments.push(conditioning);

      return {
        dayNumber: dayConfig.day,
        focus: dayConfig.focus,
        durationMinutes: responses.S5_TIME,
        exercises: assignments,
      };
    });
  }

  private buildAssignment(
    exercise: ExerciseWithRelations,
    category: 'primary' | 'secondary' | 'isolation',
    spec: { sets: number; reps: string; rest: number },
    intensity: IntensityRange,
    useRPE: boolean,
    highInjuryRisk: boolean,
    over65: boolean,
  ): ExerciseAssignment {
    // Edge case 6.6: Over 65 — increase rest 25%, shift to higher rep ranges
    const restMultiplier = over65 ? 1.25 : 1;
    const restSeconds = Math.round(spec.rest * restMultiplier);

    // Edge case 6.4: High injury risk — reduce volume 30%, increase rest 50%
    const sets = highInjuryRisk ? Math.max(2, Math.round(spec.sets * 0.70)) : spec.sets;
    const injuryRestSecs = highInjuryRisk ? Math.round(restSeconds * 1.50) : restSeconds;

    // Over 65: use 12-15 rep range
    const reps = over65 && category !== 'primary' ? '12-15' : spec.reps;

    const assignment: ExerciseAssignment = {
      exerciseId: exercise.id,
      code: exercise.code,
      name: exercise.name,
      category,
      sets,
      reps,
      restSeconds: injuryRestSecs,
    };

    if (useRPE) {
      // Doc 3 §4.2 — RPE targets by goal
      assignment.rpe = intensity.minRPE;
    } else {
      assignment.intensityPercent1RM = intensity.min1RM;
    }

    return assignment;
  }

  private buildConditioningBlock(cardioPreference?: string): ExerciseAssignment | null {
    if (!cardioPreference || cardioPreference === 'None') return null;

    const cardioSpecs: Record<string, { notes: string; durationMinutes: number }> = {
      Low:      { notes: 'Light cardio (walk, bike easy)', durationMinutes: 5 },
      Moderate: { notes: 'Steady-state or intervals (row, bike, treadmill)', durationMinutes: 10 },
      High:     { notes: 'HIIT or steady-state (20 min)', durationMinutes: 20 },
    };

    const spec = cardioSpecs[cardioPreference];
    if (!spec) return null;

    return {
      exerciseId: 'conditioning',
      code: 'CONDITIONING',
      name: `Conditioning: ${cardioPreference} intensity`,
      category: 'conditioning',
      sets: 1,
      reps: `${spec.durationMinutes} min`,
      restSeconds: 0,
      notes: spec.notes,
    };
  }

  // ─── Step 5: Periodization Model ─────────────────────────────────────────

  selectPeriodizationModel(E: number): 'double_progression' | 'linear' | 'dup' | 'block' {
    if (E < 40) return 'double_progression';
    if (E < 70) return 'linear';
    return 'dup';
  }

  // Doc 3 §5 — Progression rules by experience
  getProgressionRules(E: number, model: string): ProgressionRules {
    switch (model) {
      case 'double_progression':
        return {
          model: 'double_progression',
          instructions:
            'Increase reps by 1 each week within the target range. ' +
            'Once you hit the top of the range for all sets, increase load by 2.5-5% and reset to the bottom of the range.',
          mesocycleWeeks: undefined,
          deloadWeek: undefined,
          weeklyIncrement: undefined,
        };

      case 'linear':
        return {
          model: 'linear',
          instructions:
            'Week 1-2: Volume accumulation at 70-75% 1RM (15-18 sets/muscle). ' +
            'Week 3: Intensification at 80-85% 1RM (12-15 sets). ' +
            'Week 4: Deload at 60-65% 1RM (8-10 sets). ' +
            'Increase Week 1 baseline by 2.5-5% each mesocycle.',
          mesocycleWeeks: 4,
          deloadWeek: 4,
          weeklyIncrement: 2.5,
        };

      case 'dup':
        return {
          model: 'dup',
          instructions:
            'Daily Undulating Periodization: ' +
            'Day 1 (Strength): 3-5 reps at 85-90% 1RM, 4-6 sets. ' +
            'Day 2 (Hypertrophy): 8-12 reps at 70-80% 1RM, 3-4 sets. ' +
            'Day 3 (Power/Endurance): speed work at 50-60% 1RM or 15+ reps. ' +
            'Auto-regulate: if RPE > target for 2 sessions, reduce load 2.5%. ' +
            'If RPE < target-1 for 2 sessions, increase load 2.5%.',
          mesocycleWeeks: undefined,
          deloadWeek: undefined,
          weeklyIncrement: 2.5,
        };

      default:
        return {
          model: 'double_progression',
          instructions: 'Follow double progression: increase reps then load.',
        };
    }
  }

  // ─── Edge Case 6.1: Bodyweight fallback ──────────────────────────────────

  private async fallbackToBodyweight(
    U: UserFitnessProfileVector,
    responses: AssessmentResponses,
  ): Promise<ScoredExercise[]> {
    const bwExercises = await this.prisma.exercise.findMany({
      where: {
        equipment: { some: { equipment: { code: 'BW' } } },
        experienceMinimum: { lte: U.Experience_Score },
      },
      include: {
        muscles: { include: { muscle: true } },
        equipment: { include: { equipment: true } },
        contraindications: { include: { contraindication: true } },
        progressionsTo: {
          include: {
            fromExercise: { select: { id: true, code: true, difficultyScore: true, mobilityRequired: true } },
          },
        },
      },
    });

    const typed = bwExercises as unknown as ExerciseWithRelations[];
    return this.matcher.filterAndScore(typed, U, responses);
  }

  // ─── Edge Case 6.2: Feasibility Check ────────────────────────────────────
  // FEASIBILITY = A*0.4 + E*0.3 + R*0.3

  checkFeasibility(U: UserFitnessProfileVector, responses: AssessmentResponses): string | null {
    const feasibility =
      U.Availability_Score * 0.4 +
      U.Experience_Score   * 0.3 +
      U.Recovery_Capacity  * 0.3;

    const powerRequiresMore = responses.S4_PRIMARY === 'Power' && feasibility < 40;
    const strengthRequiresMore = responses.S4_PRIMARY === 'Strength' && feasibility < 30;

    if (powerRequiresMore) {
      return (
        'Power training typically requires 4-5 days/week and 60+ minutes/session. ' +
        'With your current availability, progress will be limited. Consider: ' +
        '(a) Adjust goal to General Health, (b) Keep goal but accept minimal progress, (c) Update availability.'
      );
    }

    if (strengthRequiresMore) {
      return (
        'Strength training is most effective at 3+ days/week with 45+ minutes/session. ' +
        'Your current schedule may limit progress. Consider adjusting your availability.'
      );
    }

    return null;
  }
}
