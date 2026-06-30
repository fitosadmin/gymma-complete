import { Injectable } from '@nestjs/common';
import { AssessmentResponses, SafetyFlag, UserFitnessProfileVector } from './types/assessment.types';

// ─── Lookup maps ─────────────────────────────────────────────────────────────

const DURATION_POINTS: Record<string, number> = {
  'Never':   0,
  '<6mo':    15,
  '6-12mo':  35,
  '1-2yr':   55,
  '2-5yr':   80,
  '5+yr':    100,
};

const OCCUPATION_MAP: Record<string, number> = {
  Sedentary:   1,
  Light:       2,
  Active:      3,
  Very_Active: 4,
};

const STRESS_MAP: Record<string, number> = {
  Low:  1,
  Med:  2,
  High: 3,
};

const NUTRITION_MAP: Record<string, number> = {
  Poor:         1,
  Inconsistent: 2,
  Consistent:   3,
  Strict:       4,
};

const GYM_TYPE_FACTOR: Record<string, number> = {
  Home:       8,
  Commercial: 10,
  Outdoor:    7,
};

// Doc 3 §2.1 — 6×6 conflict penalty matrix
const CONFLICT_PENALTY: Record<string, Record<string, number>> = {
  Strength:      { Hypertrophy: 0.3, Endurance: 0.8, Power: 0.1, General_Health: 0.2, Recomposition: 0.3 },
  Hypertrophy:   { Strength: 0.3, Endurance: 0.6, Power: 0.4, General_Health: 0.2, Recomposition: 0.1 },
  Endurance:     { Strength: 0.8, Hypertrophy: 0.6, Power: 0.7, General_Health: 0.3, Recomposition: 0.5 },
  Power:         { Strength: 0.1, Hypertrophy: 0.4, Endurance: 0.7, General_Health: 0.3, Recomposition: 0.4 },
  General_Health:{ Strength: 0.2, Hypertrophy: 0.2, Endurance: 0.3, Power: 0.3, Recomposition: 0.1 },
  Recomposition: { Strength: 0.3, Hypertrophy: 0.1, Endurance: 0.5, Power: 0.4, General_Health: 0.1 },
};

// Strength standards (bodyweight multiplier): [Novice, Intermediate, Advanced, Elite]
const STRENGTH_STANDARDS = {
  M: {
    squat:     [1.0, 1.5, 2.0, 2.5],
    deadlift:  [1.2, 1.8, 2.5, 3.0],
    bench:     [0.75, 1.25, 1.75, 2.25],
  },
  F: {
    squat:     [0.65, 1.0, 1.3, 1.6],
    deadlift:  [0.8, 1.2, 1.6, 2.0],
    bench:     [0.4, 0.75, 1.1, 1.4],
  },
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

@Injectable()
export class VectorComputationService {
  // ─── Public entry point ──────────────────────────────────────────────────

  computeUserVector(r: AssessmentResponses): UserFitnessProfileVector {
    return {
      Goal_Alignment:      clamp(this.computeG(r)),
      Recovery_Capacity:   clamp(this.computeR(r)),
      Mobility_Score:      clamp(this.computeM(r)),
      Strength_Level:      clamp(this.computeS(r)),
      Experience_Score:    clamp(this.computeE(r)),
      Availability_Score:  clamp(this.computeA(r)),
      Injury_Risk:         clamp(this.computeI(r)),
      Preference_Alignment: 50, // post-hoc; default 50 at submission
    };
  }

  computeSafetyFlags(r: AssessmentResponses): SafetyFlag[] {
    const flags: SafetyFlag[] = [];

    if (r.S0_Q2 || r.S0_Q3) flags.push('MEDICAL_CLEARANCE_REQUIRED', 'CARDIOVASCULAR_RISK');
    if (r.S0_Q1) flags.push('CARDIOVASCULAR_RISK');
    if (r.S0_Q4) flags.push('MUSCULOSKELETAL_RISK');
    if (r.S0_Q5) flags.push('MAX_HEART_RATE_REDUCED');
    if (r.S0_Q6) flags.push('PREGNANCY_POSTPARTUM');
    if (r.S0_Q7) flags.push('METABOLIC_ADJUSTMENT');
    if (r.S6_PAST_SURGERY) flags.push('POST_SURGICAL');
    if (r.S6_PAIN_SCALE !== undefined && r.S6_PAIN_SCALE > 3) flags.push('LOAD_RESTRICTION');

    return [...new Set(flags)];
  }

  // ─── 2.5 Experience Score (E) — most critical, drives branching ──────────
  computeE(r: AssessmentResponses): number {
    const durationPoints = DURATION_POINTS[r.S3_DURATION] ?? 0;
    const compoundPoints = (r.S3_COMPOUNDS?.length ?? 0) * 10; // max 50 (5 lifts × 10)

    const programPoints = r.S3_PROGRAM ? 15 : 0;

    // Frequency points: 0→0, 1-2→5, 3-4→10, 5-6→15, 7+→20
    const freq = r.S3_FREQUENCY ?? 0;
    let frequencyPoints: number;
    if (freq === 0) frequencyPoints = 0;
    else if (freq <= 2) frequencyPoints = 5;
    else if (freq <= 4) frequencyPoints = 10;
    else if (freq <= 6) frequencyPoints = 15;
    else frequencyPoints = 20;

    return clamp(
      durationPoints * 0.50 +
      compoundPoints * 0.30 +
      programPoints  * 0.15 +
      frequencyPoints * 0.05,
    );
  }

  // ─── 2.1 Goal Alignment (G) ───────────────────────────────────────────────
  computeG(r: AssessmentResponses): number {
    if (!r.S4_SECONDARY) return 100;
    const penalty = CONFLICT_PENALTY[r.S4_PRIMARY]?.[r.S4_SECONDARY] ?? 0;
    return Math.max(0, 100 - penalty * 15);
  }

  // ─── 2.2 Recovery Capacity (R) ───────────────────────────────────────────
  // R_max = 240 + 60 + 60 + 100 + 31.5 = 491.5
  computeR(r: AssessmentResponses): number {
    const sleep       = r.S2_SLEEP * r.S2_SLEEP_QUALITY * 4;
    const occupation  = OCCUPATION_MAP[r.S2_OCCUPATION] * 15;
    const stress      = (4 - STRESS_MAP[r.S2_STRESS]) * 20;
    const nutrition   = NUTRITION_MAP[r.S2_NUTRITION] * 25;
    const alcohol     = Math.max(0, 21 - (r.S2_ALCOHOL ?? 0)) * 1.5;
    const raw         = sleep + occupation + stress + nutrition + alcohol;
    return clamp((raw / 491.5) * 100);
  }

  // ─── 2.3 Mobility Score (M) ───────────────────────────────────────────────
  computeM(r: AssessmentResponses): number {
    const E = this.computeE(r);
    if (E < 20) return 50; // beginners default — avoid false negatives

    const squat    = r.S7_SQUAT_DEPTH === 'Yes' ? 25 : r.S7_SQUAT_DEPTH === 'Only with raised heels' ? 15 : 5;
    const overhead = r.S7_OVERHEAD === 'Yes' ? 25 : r.S7_OVERHEAD === 'Partial' ? 15 : 5;
    const hinge    = r.S7_HINGE === 'Yes' ? 20 : r.S7_HINGE === 'Almost' ? 12 : 5;
    const lunge    = r.S7_LUNGE === 'Yes' ? 20 : r.S7_LUNGE === 'Unstable' ? 10 : 5;
    const rotary   = r.S7_ROTARY === 'Yes' ? 10 : 5;

    return clamp(squat + overhead + hinge + lunge + rotary);
  }

  // ─── 2.4 Strength Level (S) ───────────────────────────────────────────────
  computeS(r: AssessmentResponses): number {
    const E = this.computeE(r);

    if (!r.S3_1RM_AWARE || E < 20 ||
        r.S3_SQUAT_1RM === undefined ||
        r.S3_DEADLIFT_1RM === undefined ||
        r.S3_BENCH_1RM === undefined) {
      return clamp(E * 0.8); // proxy when 1RMs unavailable
    }

    const standards = r.S1_SEX === 'F' ? STRENGTH_STANDARDS.F : STRENGTH_STANDARDS.M;
    const bw = r.S1_WEIGHT;

    const squatRatio    = r.S3_SQUAT_1RM    / bw;
    const deadliftRatio = r.S3_DEADLIFT_1RM / bw;
    const benchRatio    = r.S3_BENCH_1RM    / bw;

    const squatPerc    = this.ratioToPercentile(squatRatio,    standards.squat);
    const deadliftPerc = this.ratioToPercentile(deadliftRatio, standards.deadlift);
    const benchPerc    = this.ratioToPercentile(benchRatio,    standards.bench);

    return clamp((squatPerc + deadliftPerc + benchPerc) / 3);
  }

  // ─── 2.6 Availability Score (A) ──────────────────────────────────────────
  // A_max = (7*12) + (120*0.5) + 10 = 84 + 60 + 10 = 154
  computeA(r: AssessmentResponses): number {
    const gymFactor = GYM_TYPE_FACTOR[r.S5_GYM_TYPE] ?? 8;
    const raw = (r.S5_DAYS * 12) + (r.S5_TIME * 0.5) + gymFactor;
    return clamp((raw / 154) * 100);
  }

  // ─── 2.7 Injury Risk (I) ─────────────────────────────────────────────────
  // Higher I = more restrictions. Accumulate flags, cap at 100.
  computeI(r: AssessmentResponses): number {
    let base = 0;
    if (r.S0_Q2 || r.S0_Q3) base += 30; // cardiovascular risk
    if (r.S0_Q4) base += 20;             // musculoskeletal risk
    if (r.S0_Q5) base += 10;             // medication (heart/BP)
    if (r.S6_CURRENT_INJURY) base += (r.S6_PAIN_SCALE ?? 0) * 5;
    if (r.S6_PAST_SURGERY) base += 15;
    if (r.S6_PHYSIO) base += 10;
    return clamp(base);
  }

  // ─── 2.8 Preference Alignment (P) — always 50 at submission ─────────────
  computeP(): number { return 50; }

  // ─── Private helpers ─────────────────────────────────────────────────────

  // Interpolate strength percentile across [Novice, Intermediate, Advanced, Elite] brackets
  private ratioToPercentile(ratio: number, standards: number[]): number {
    const [novice, intermediate, advanced, elite] = standards;
    if (ratio < novice)        return clamp((ratio / novice) * 25);
    if (ratio < intermediate)  return clamp(25 + ((ratio - novice) / (intermediate - novice)) * 25);
    if (ratio < advanced)      return clamp(50 + ((ratio - intermediate) / (advanced - intermediate)) * 25);
    if (ratio < elite)         return clamp(75 + ((ratio - advanced) / (elite - advanced)) * 25);
    return clamp(100 + ((ratio - elite) / elite) * 25);
  }
}
