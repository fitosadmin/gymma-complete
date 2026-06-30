import { Injectable } from '@nestjs/common';
import { UserFitnessProfileVector, AssessmentResponses } from '../assessment/types/assessment.types';
import { ExerciseWithRelations, ScoredExercise } from './types/workout-plan.types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExerciseMatcherService {
  constructor(private prisma: PrismaService) {}

  // ─── Step 3 + 4: Hard filters then soft scoring ──────────────────────────

  async filterAndScore(
    gymExercises: ExerciseWithRelations[],
    U: UserFitnessProfileVector,
    responses: AssessmentResponses,
  ): Promise<ScoredExercise[]> {
    const candidates = await this.applyHardFilters(gymExercises, U, responses);
    return candidates.map((exercise) => ({
      exercise,
      matchScore: this.computeMatchScore(exercise, U, responses),
    })).sort((a, b) => b.matchScore - a.matchScore);
  }

  // ─── Doc 3 §3.1 — 5 Hard Gates (sequential, in order) ───────────────────

  private async applyHardFilters(
    exercises: ExerciseWithRelations[],
    U: UserFitnessProfileVector,
    responses: AssessmentResponses,
  ): Promise<ExerciseWithRelations[]> {
    const dislikes = new Set((responses.S8_DISLIKES ?? []).map((c) => c.toLowerCase()));
    const injuryFlags = new Set(this.resolveInjuryFlags(responses));
    const candidates: ExerciseWithRelations[] = [];

    for (const exercise of exercises) {
      // GATE 1 — Experience: exercise too advanced
      if (exercise.experienceMinimum > U.Experience_Score) continue;

      // GATE 2 — Equipment: handled by gym_exercise_database (exercises here are already gym-filtered)
      // (still guard in case caller passes unfiltered set)

      // GATE 3 — Blacklist: user explicitly dislikes this exercise
      if (dislikes.has(exercise.code.toLowerCase()) || dislikes.has(exercise.name.toLowerCase())) continue;

      // GATE 4 — Contraindication: absolute or relative blocks
      let contraindicated = false;
      for (const ec of exercise.contraindications) {
        if (injuryFlags.has(ec.contraindication.flag)) {
          if (ec.severity === 'absolute' || ec.severity === 'relative') {
            contraindicated = true;
            break;
          }
        }
      }
      if (contraindicated) continue;

      // GATE 5 — Mobility: exercise requires more mobility than user has
      if (exercise.mobilityRequired > U.Mobility_Score) {
        // Walk the regression chain to find a suitable alternative
        const regression = await this.findSuitableRegression(exercise, U, injuryFlags, dislikes, responses);
        if (regression && !candidates.some((c) => c.id === regression.id)) {
          candidates.push(regression);
        }
        continue;
      }

      candidates.push(exercise);
    }

    return candidates;
  }

  // ─── Doc 3 §3.2 — Soft Scoring ───────────────────────────────────────────
  // MATCH_SCORE = w1*Ge + w2*DiffFit + w3*(100-|Me-M|) + w4*(100-Re) + w5*Pe + w6*MP

  computeMatchScore(
    exercise: ExerciseWithRelations,
    U: UserFitnessProfileVector,
    responses: AssessmentResponses,
  ): number {
    const Ge  = this.getGoalCompatibility(exercise, responses.S4_PRIMARY, responses.S4_SECONDARY);
    const Fit = this.difficultyFit(exercise.difficultyScore, U.Experience_Score);
    const Mob = 100 - Math.abs(exercise.mobilityRequired - U.Mobility_Score);
    const Saf = 100 - exercise.injuryRiskFactor;
    const Eq  = 100; // already gym-filtered
    const MP  = this.musclePriority(exercise, responses.S4_TARGET_AREAS ?? []);

    return (
      0.30 * Ge  +
      0.25 * Fit +
      0.10 * Mob +
      0.15 * Saf +
      0.10 * Eq  +
      0.10 * MP
    );
  }

  // ─── Doc 3 §3.3 — Difficulty Fit Bell Curve ──────────────────────────────
  // DIFFICULTY_FIT = 100 * exp(-((De - (E-10))²) / (2 * 20²))
  // Target difficulty is 10 points BELOW user experience (safer, not failure-threshold)
  difficultyFit(De: number, E: number): number {
    const sigma = 20;
    const target = E - 10;
    return 100 * Math.exp(-(Math.pow(De - target, 2)) / (2 * sigma * sigma));
  }

  // ─── Doc 3 §3.4 — Goal Compatibility Weighting ───────────────────────────
  getGoalCompatibility(
    exercise: ExerciseWithRelations,
    primary: string,
    secondary?: string,
  ): number {
    const primaryScore = this.getGoalScore(exercise, primary);
    if (!secondary) return primaryScore;

    const secondaryScore = this.getGoalScore(exercise, secondary);
    return Math.min(100, primaryScore + 0.15 * secondaryScore);
  }

  private getGoalScore(exercise: ExerciseWithRelations, goal: string): number {
    switch (goal) {
      case 'Strength':       return exercise.goalStrength;
      case 'Hypertrophy':    return exercise.goalHypertrophy;
      case 'Endurance':      return exercise.goalEndurance;
      case 'Power':          return exercise.goalPower;
      case 'General_Health': return Math.round((exercise.goalStrength + exercise.goalHypertrophy + exercise.goalEndurance + exercise.goalPower) / 4);
      case 'Recomposition':  return Math.round(exercise.goalHypertrophy * 0.7 + exercise.goalStrength * 0.3);
      default:               return 50;
    }
  }

  // ─── Muscle Priority ─────────────────────────────────────────────────────
  // +30 primary, +15 secondary, +5 tertiary — normalize to [0, 100]
  musclePriority(exercise: ExerciseWithRelations, targetAreas: string[]): number {
    if (targetAreas.length === 0) return 50;

    const targets = new Set(targetAreas.map((t) => t.toUpperCase()));
    let score = 0;

    for (const em of exercise.muscles) {
      const muscleName = em.muscle.name.toUpperCase();
      if (!targets.has(muscleName)) continue;
      if (em.role === 'primary') score += 30;
      else if (em.role === 'secondary') score += 15;
      else if (em.role === 'tertiary') score += 5;
    }

    return Math.min(100, score);
  }

  // ─── Regression Walking (Mobility Gate fallback) ─────────────────────────
  // Walks the progression chain backwards (easier versions) until mobility requirement is met
  private async findSuitableRegression(
    exercise: ExerciseWithRelations,
    U: UserFitnessProfileVector,
    injuryFlags: Set<string>,
    dislikes: Set<string>,
    responses: AssessmentResponses,
    hops = 0,
  ): Promise<ExerciseWithRelations | null> {
    if (hops >= 5) return null; // prevent infinite regression loops

    // exercise.progressionsTo gives entries where toExercise = this exercise
    // fromExercise is the easier version
    const regressions = exercise.progressionsTo;
    if (!regressions || regressions.length === 0) return null;

    for (const reg of regressions) {
      const easierEx = await this.prisma.exercise.findUnique({
        where: { id: reg.fromExercise.id },
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

      if (!easierEx) continue;

      // Check experience gate
      if (easierEx.experienceMinimum > U.Experience_Score) continue;

      // Check dislikes
      if (dislikes.has(easierEx.code.toLowerCase())) continue;

      // Check contraindications
      let contraindicated = false;
      for (const ec of easierEx.contraindications) {
        if (injuryFlags.has(ec.contraindication.flag) && (ec.severity === 'absolute' || ec.severity === 'relative')) {
          contraindicated = true;
          break;
        }
      }
      if (contraindicated) continue;

      // Check mobility — if still fails, recurse deeper
      if (easierEx.mobilityRequired <= U.Mobility_Score) {
        return easierEx as unknown as ExerciseWithRelations;
      }

      const deeper = await this.findSuitableRegression(
        easierEx as unknown as ExerciseWithRelations,
        U, injuryFlags, dislikes, responses, hops + 1,
      );
      if (deeper) return deeper;
    }

    return null;
  }

  // ─── Map injury section responses to contraindication flag strings ────────
  private resolveInjuryFlags(responses: AssessmentResponses): string[] {
    const flags: string[] = [];

    if (responses.S0_Q2 || responses.S0_Q3) flags.push('CARDIOVASCULAR_RISK');
    if (responses.S6_CURRENT_INJURY && responses.S6_INJURY_LIST) {
      for (const area of responses.S6_INJURY_LIST) {
        switch (area.toUpperCase()) {
          case 'SHOULDER': flags.push('SHOULDER_IMPINGEMENT'); break;
          case 'BACK':
          case 'LOWER BACK': flags.push('LOW_BACK_PAIN'); break;
          case 'KNEE': flags.push('KNEE_PAIN'); break;
          case 'WRIST':
          case 'ELBOW': flags.push('WRIST_PAIN'); break;
          case 'ANKLE': flags.push('ANKLE_MOBILITY_LIMIT'); break;
        }
      }
    }
    if (responses.S6_PAST_SURGERY) flags.push('POST_SURGICAL');
    if (responses.S0_Q6) flags.push('PREGNANCY_POSTPARTUM');
    if (responses.S0_Q7) flags.push('METABOLIC_CONDITION');

    // S7 mobility failures also generate flags
    if (responses.S7_SQUAT_DEPTH === 'No') flags.push('ANKLE_MOBILITY_LIMIT');
    if (responses.S7_OVERHEAD === 'No') flags.push('SHOULDER_IMPINGEMENT');

    return [...new Set(flags)];
  }
}
