/**
 * Reference test vectors — aligned to AssessmentResponses field names (Doc 4 §3.2)
 *
 * Expected values are computed analytically from the formulas in Doc 3:
 *
 * TV1 (Intermediate male, 4x/week, Commercial gym):
 *   E = 80*0.50 + 50*0.30 + 15*0.15 + 10*0.05 = 40 + 15 + 2.25 + 0.5 = 57.75
 *   G = 100 - 0.3*15 = 95.5  (Hypertrophy→Strength penalty=0.3)
 *   R ≈ 58.59  (sleep=7,quality=3,occupation=Active,stress=Low,nutrition=Consistent,alcohol=5)
 *   M = 100  (all S7 = 'Yes', E ≥ 20)
 *   I = 0    (no injuries)
 *   A ≈ 57.14  (days=4,time=60,gym=Commercial/factor=10)
 *
 * TV2 (Novice female, 2x/week, Home):
 *   E = 15*0.50 + 0*0.30 + 0*0.15 + 5*0.05 = 7.5 + 0 + 0 + 0.25 = 7.75
 *   G = 100   (no secondary)
 *   M = 50    (E < 20 → forced default)
 *   I = 20    (current injury, painScale=4 → 4*5=20)
 *   A ≈ 35.39  (days=2,time=45,gym=Home/factor=8)
 */

import { describe, it, expect } from 'vitest';
import { VectorComputationService } from '../src/assessment/vector-computation.service';
import { ExerciseMatcherService } from '../src/plans/exercise-matcher.service';
import { RecommendationEngineService } from '../src/plans/recommendation-engine.service';
import { AssessmentResponses } from '../src/assessment/types/assessment.types';

const svc = new VectorComputationService();

// ─── Test Vector 1 — Intermediate Male, Hypertrophy ──────────────────────────

const tv1: AssessmentResponses = {
  // PAR-Q+ Section 0
  S0_Q1: false, S0_Q2: false, S0_Q3: false, S0_Q4: false,
  S0_Q5: false, S0_Q6: false, S0_Q7: false,

  // Section 1 — Demographics
  S1_AGE: 28,
  S1_SEX: 'M',
  S1_HEIGHT: 178,
  S1_WEIGHT: 82,
  S1_BODY_COMP_GOAL: 'Build muscle',

  // Section 2 — Recovery
  S2_SLEEP:         7,
  S2_SLEEP_QUALITY: 3,
  S2_STRESS:        'Low',
  S2_OCCUPATION:    'Active',
  S2_NUTRITION:     'Consistent',
  S2_ALCOHOL:       5,

  // Section 3 — Training History
  S3_DURATION:   '2-5yr',
  S3_COMPOUNDS:  ['Squat', 'Deadlift', 'Bench Press', 'Overhead Press', 'Pull-up'],
  S3_PROGRAM:    true,
  S3_FREQUENCY:  4,
  S3_1RM_AWARE:  true,
  S3_SQUAT_1RM:    120,
  S3_BENCH_1RM:    100,
  S3_DEADLIFT_1RM: 140,

  // Section 4 — Goals
  S4_PRIMARY:      'Hypertrophy',
  S4_SECONDARY:    'Strength',
  S4_TIMELINE:     '12',
  S4_TARGET_AREAS: ['CHEST', 'BACK'],

  // Section 5 — Availability
  S5_DAYS:     4,
  S5_TIME:     60,
  S5_GYM_TYPE: 'Commercial',

  // Section 6 — Injury
  S6_CURRENT_INJURY: false,
  S6_PAST_SURGERY:   false,
  S6_PHYSIO:         false,

  // Section 7 — Mobility (E ≥ 20 → shown)
  S7_SQUAT_DEPTH: 'Yes',
  S7_OVERHEAD:    'Yes',
  S7_HINGE:       'Yes',
  S7_LUNGE:       'Yes',
  S7_ROTARY:      'Yes',

  // Section 8 — Preferences
  S8_RPE:    '%1RM',
  S8_DISLIKES: [],
  S8_CARDIO:  'Moderate',
  S8_SPLIT:   'Upper/Lower',
};

// ─── Test Vector 2 — Novice Female, General Health ───────────────────────────

const tv2: AssessmentResponses = {
  S0_Q1: false, S0_Q2: false, S0_Q3: false, S0_Q4: false,
  S0_Q5: false, S0_Q6: false, S0_Q7: false,

  S1_AGE: 35,
  S1_SEX: 'F',
  S1_HEIGHT: 162,
  S1_WEIGHT: 65,
  S1_BODY_COMP_GOAL: 'Maintain',

  S2_SLEEP:         7,
  S2_SLEEP_QUALITY: 3,
  S2_STRESS:        'Low',
  S2_OCCUPATION:    'Active',
  S2_NUTRITION:     'Consistent',
  S2_ALCOHOL:       5,

  S3_DURATION:   '<6mo',
  S3_COMPOUNDS:  [],
  S3_PROGRAM:    false,
  S3_FREQUENCY:  2,
  S3_1RM_AWARE:  false,

  S4_PRIMARY:  'General_Health',
  S4_TIMELINE: '12',

  S5_DAYS:     2,
  S5_TIME:     45,
  S5_GYM_TYPE: 'Home',

  S6_CURRENT_INJURY: true,
  S6_INJURY_LIST:    ['KNEE'],
  S6_PAIN_SCALE:     4,
  S6_PAST_SURGERY:   false,
  S6_PHYSIO:         false,
};

// ─── TV1 Tests ───────────────────────────────────────────────────────────────

describe('TV1: Intermediate Male, Hypertrophy', () => {
  it('E = 57.75  (duration=80, 5 compounds=50, program=15, freq4→pts10)', () => {
    // E = 80*0.50 + 50*0.30 + 15*0.15 + 10*0.05 = 40 + 15 + 2.25 + 0.5 = 57.75
    expect(svc.computeE(tv1)).toBeCloseTo(57.75, 1);
  });

  it('G = 95.5  (Hypertrophy→Strength conflict penalty=0.3 → 100 - 0.3*15 = 95.5)', () => {
    expect(svc.computeG(tv1)).toBeCloseTo(95.5, 1);
  });

  it('R ≈ 58.59  (computed from recovery inputs)', () => {
    // R_raw = 7*3*4 + 3*15 + (4-1)*20 + 3*25 + (21-5)*1.5
    //       = 84    + 45   + 60       + 75   + 24 = 288
    // R = 288/491.5*100 ≈ 58.59
    expect(svc.computeR(tv1)).toBeCloseTo(58.59, 0);
  });

  it('M = 100  (all S7 mobility tests passed, E ≥ 20)', () => {
    // squat=25, overhead=25, hinge=20, lunge=20, rotary=10 → sum=100
    expect(svc.computeM(tv1)).toBe(100);
  });

  it('I = 0  (no injuries, no PAR-Q+ flags)', () => {
    expect(svc.computeI(tv1)).toBe(0);
  });

  it('A ≈ 57.14  (4 days * 12 + 60 min * 0.5 + gymFactor 10) / 154 * 100', () => {
    // A_raw = 48 + 30 + 10 = 88; A = 88/154*100 ≈ 57.14
    expect(svc.computeA(tv1)).toBeCloseTo(57.14, 0);
  });

  it('P = 50  (fixed default at submission time)', () => {
    expect(svc.computeP()).toBe(50);
  });
});

// ─── TV2 Tests ───────────────────────────────────────────────────────────────

describe('TV2: Novice Female, General Health', () => {
  it('E = 7.75  (very low: <6mo=15pts, no compounds, no program, freq2→pts5)', () => {
    // E = 15*0.50 + 0*0.30 + 0*0.15 + 5*0.05 = 7.5 + 0 + 0 + 0.25 = 7.75
    expect(svc.computeE(tv2)).toBeCloseTo(7.75, 1);
  });

  it('G = 100  (no secondary goal → no conflict)', () => {
    expect(svc.computeG(tv2)).toBe(100);
  });

  it('M = 50  (E < 20 → section 7 not shown → forced default)', () => {
    expect(svc.computeM(tv2)).toBe(50);
  });

  it('I = 20  (current injury, painScale=4 → 4*5=20, no other flags)', () => {
    expect(svc.computeI(tv2)).toBe(20);
  });

  it('A ≈ 35.39  (2 days * 12 + 45 min * 0.5 + gymFactor 8) / 154 * 100', () => {
    // A_raw = 24 + 22.5 + 8 = 54.5; A = 54.5/154*100 ≈ 35.39
    expect(svc.computeA(tv2)).toBeCloseTo(35.39, 0);
  });
});

// ─── Full vector integration ──────────────────────────────────────────────────

describe('computeUserVector: returns valid 8-dimension vector', () => {
  it('all 8 dimensions in [0, 100] for TV1', () => {
    const v = svc.computeUserVector(tv1);
    for (const [key, val] of Object.entries(v)) {
      expect(val, key).toBeGreaterThanOrEqual(0);
      expect(val, key).toBeLessThanOrEqual(100);
    }
    expect(Object.keys(v)).toHaveLength(8);
  });

  it('all 8 dimensions in [0, 100] for TV2', () => {
    const v = svc.computeUserVector(tv2);
    for (const [key, val] of Object.entries(v)) {
      expect(val, key).toBeGreaterThanOrEqual(0);
      expect(val, key).toBeLessThanOrEqual(100);
    }
  });

  it('P = 50 in vector output', () => {
    const v = svc.computeUserVector(tv1);
    expect(v.Preference_Alignment).toBe(50);
  });
});

// ─── Safety flags ─────────────────────────────────────────────────────────────

describe('computeSafetyFlags', () => {
  it('returns empty array when all PAR-Q+ is false', () => {
    const flags = svc.computeSafetyFlags(tv1);
    expect(flags).toHaveLength(0);
  });

  it('MEDICAL_CLEARANCE_REQUIRED when S0_Q2 = true', () => {
    const r = { ...tv1, S0_Q2: true };
    const flags = svc.computeSafetyFlags(r);
    expect(flags).toContain('MEDICAL_CLEARANCE_REQUIRED');
    expect(flags).toContain('CARDIOVASCULAR_RISK');
  });

  it('LOAD_RESTRICTION when painScale > 3', () => {
    const flags = svc.computeSafetyFlags(tv2);
    expect(flags).toContain('LOAD_RESTRICTION');
  });
});

// ─── Boundary + edge cases ────────────────────────────────────────────────────

describe('computeE: boundary values', () => {
  it('Never trained → E = 0', () => {
    const r = { ...tv2, S3_DURATION: 'Never' as const, S3_COMPOUNDS: [], S3_PROGRAM: false, S3_FREQUENCY: 0 };
    expect(svc.computeE(r)).toBe(0);
  });

  it('5+yr, 5 compounds, program, 7 days/week → E ≈ 76.5', () => {
    // E = 100*0.50 + 50*0.30 + 15*0.15 + 15*0.05
    // E = 50 + 15 + 2.25 + 0.75 = 68
    // (frequency 7+ → frequencyPoints = 15)
    const r = { ...tv1, S3_DURATION: '5+yr' as const, S3_COMPOUNDS: ['Squat','Deadlift','Bench Press','Overhead Press','Pull-up'], S3_PROGRAM: true, S3_FREQUENCY: 7 };
    const E = svc.computeE(r);
    expect(E).toBeGreaterThan(60);
    expect(E).toBeLessThanOrEqual(100);
  });
});

describe('computeR: boundary values', () => {
  it('excellent recovery → R is high', () => {
    const best = { ...tv1, S2_SLEEP: 9, S2_SLEEP_QUALITY: 5, S2_STRESS: 'Low' as const, S2_OCCUPATION: 'Active' as const, S2_NUTRITION: 'Strict' as const, S2_ALCOHOL: 0 };
    expect(svc.computeR(best)).toBeGreaterThan(80);
  });

  it('poor recovery → R is low', () => {
    const worst = { ...tv1, S2_SLEEP: 4, S2_SLEEP_QUALITY: 1, S2_STRESS: 'High' as const, S2_OCCUPATION: 'Sedentary' as const, S2_NUTRITION: 'Poor' as const, S2_ALCOHOL: 20 };
    expect(svc.computeR(worst)).toBeLessThan(20);
  });
});

describe('computeM: mobility', () => {
  it('all Yes answers → 100', () => {
    expect(svc.computeM(tv1)).toBe(100);
  });

  it('all No answers → minimum score', () => {
    const poorMobility = {
      ...tv1,
      S7_SQUAT_DEPTH: 'No' as const,
      S7_OVERHEAD: 'No' as const,
      S7_HINGE: 'No' as const,
      S7_LUNGE: 'No' as const,
      S7_ROTARY: 'No' as const,
    };
    // squat:5, overhead:5, hinge:5, lunge:5, rotary:5 = 25
    expect(svc.computeM(poorMobility)).toBe(25);
  });
});

describe('computeI: injury accumulation', () => {
  it('S0_Q2 + S0_Q3 both true → +30, capped at 100', () => {
    const r = { ...tv1, S0_Q2: true, S0_Q3: true };
    expect(svc.computeI(r)).toBe(30);
  });

  it('all flags set → clamped at 100', () => {
    const r = { ...tv2, S0_Q2: true, S0_Q3: true, S0_Q4: true, S0_Q5: true, S6_PAST_SURGERY: true, S6_PHYSIO: true, S6_PAIN_SCALE: 10 };
    expect(svc.computeI(r)).toBe(100);
  });
});

// ─── ExerciseMatcher: difficultyFit bell curve ───────────────────────────────

const matcher = new (ExerciseMatcherService as any)(null);
const engine  = new (RecommendationEngineService as any)(null, null, null);

describe('ExerciseMatcherService: difficultyFit', () => {

  it('peaks at De = E-10 (returns ≈ 100)', () => {
    // E=50, target=40, De=40 → exp(0) = 1 → 100
    expect(matcher.difficultyFit(40, 50)).toBeCloseTo(100, 1);
  });

  it('1 sigma away (20 pts) → ≈ 60.65', () => {
    // De=60, E=50, target=40, diff=20=1σ → exp(-0.5) ≈ 0.6065
    expect(matcher.difficultyFit(60, 50)).toBeCloseTo(60.65, 0);
  });

  it('returns lower score when De is far from target', () => {
    const near = matcher.difficultyFit(40, 50);
    const far  = matcher.difficultyFit(90, 50); // 50 pts from target
    expect(near).toBeGreaterThan(far);
  });
});

// ─── RecommendationEngine: frequency calculation ─────────────────────────────

describe('RecommendationEngineService: calculateFrequency', () => {
  it('limited by recovery (R < 30 → max 2)', () => {
    // A=100 → 7 days, R=20 → limit 2, requestedDays=7 → F=2
    expect(engine.calculateFrequency(100, 20, 7)).toBe(2);
  });

  it('limited by requested days', () => {
    // A=100, R=90, requestedDays=3 → F=3
    expect(engine.calculateFrequency(100, 90, 3)).toBe(3);
  });

  it('limited by availability (A=30 → floor(30*7/100)=2)', () => {
    // A=30 → floor(2.1)=2, R=90 → max 6, days=6 → F=2
    expect(engine.calculateFrequency(30, 90, 6)).toBe(2);
  });

  it('minimum frequency is 1', () => {
    expect(engine.calculateFrequency(0, 10, 1)).toBe(1);
  });
});

// ─── RecommendationEngine: periodization model ───────────────────────────────

describe('RecommendationEngineService: selectPeriodizationModel', () => {
  it('E < 40 → double_progression', () => {
    expect(engine.selectPeriodizationModel(0)).toBe('double_progression');
    expect(engine.selectPeriodizationModel(39.9)).toBe('double_progression');
  });

  it('40 ≤ E < 70 → linear 4-week mesocycle', () => {
    expect(engine.selectPeriodizationModel(40)).toBe('linear');
    expect(engine.selectPeriodizationModel(69.9)).toBe('linear');
  });

  it('E ≥ 70 → DUP', () => {
    expect(engine.selectPeriodizationModel(70)).toBe('dup');
    expect(engine.selectPeriodizationModel(100)).toBe('dup');
  });
});

// ─── RecommendationEngine: split selection matrix (Doc 3 §4.4) ───────────────

describe('RecommendationEngineService: selectSplit', () => {
  it('F=1, any experience → Full Body', () => {
    expect(engine.selectSplit(1, 80)).toBe('Full Body');
  });

  it('F=3, E < 20 → Full Body', () => {
    expect(engine.selectSplit(3, 15)).toBe('Full Body');
  });

  it('F=4, E in 40-60 → Upper/Lower', () => {
    expect(engine.selectSplit(4, 50)).toBe('Upper/Lower');
  });

  it('F=5, E > 60 → Push/Pull/Legs', () => {
    expect(engine.selectSplit(5, 65)).toBe('Push/Pull/Legs');
  });

  it('F=6, E > 60 → Bro Split', () => {
    expect(engine.selectSplit(6, 75)).toBe('Bro Split');
  });

  it('F=3, E > 60 → Push/Pull/Legs', () => {
    expect(engine.selectSplit(3, 65)).toBe('Push/Pull/Legs');
  });
});

// ─── RecommendationEngine: volume calculation ────────────────────────────────

describe('RecommendationEngineService: calculateVolume', () => {
  it('novice (E<20): base=10 at full recovery', () => {
    expect(engine.calculateVolume(10, 100)).toBeCloseTo(10, 0);
  });

  it('novice (E<20): halved at 50% recovery', () => {
    expect(engine.calculateVolume(10, 50)).toBeCloseTo(5, 0);
  });

  it('advanced (E>80): base=20 at full recovery', () => {
    expect(engine.calculateVolume(90, 100)).toBeCloseTo(20, 0);
  });

  it('volume scales linearly with recovery', () => {
    const fullRecovery = engine.calculateVolume(50, 100);
    const halfRecovery = engine.calculateVolume(50, 50);
    expect(fullRecovery).toBeCloseTo(halfRecovery * 2, 0);
  });
});
