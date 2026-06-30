export interface UserFitnessProfileVector {
  Goal_Alignment: number;       // G — 0-100
  Recovery_Capacity: number;    // R — 0-100
  Mobility_Score: number;       // M — 0-100
  Strength_Level: number;       // S — 0-100
  Experience_Score: number;     // E — 0-100
  Availability_Score: number;   // A — 0-100
  Injury_Risk: number;          // I — 0-100 (higher = more restrictions)
  Preference_Alignment: number; // P — 0-100 (50 at compute time; post-hoc)
}

export interface AssessmentResponses {
  // Section 0: Safety Screening
  S0_Q1: boolean;
  S0_Q2: boolean;
  S0_Q3: boolean;
  S0_Q4: boolean;
  S0_Q5: boolean;
  S0_Q6?: boolean;
  S0_Q7: boolean;

  // Section 1: Identity & Body
  S1_AGE: number;
  S1_SEX: 'M' | 'F' | 'Other';
  S1_HEIGHT: number;
  S1_WEIGHT: number;
  S1_BODYFAT?: number;
  S1_GOAL_WEIGHT?: number;
  S1_BODY_COMP_GOAL: string;

  // Section 2: Recovery
  S2_SLEEP: number;
  S2_SLEEP_QUALITY: number;
  S2_STRESS: 'Low' | 'Med' | 'High';
  S2_OCCUPATION: 'Sedentary' | 'Light' | 'Active' | 'Very_Active';
  S2_ALCOHOL?: number;
  S2_NUTRITION: 'Poor' | 'Inconsistent' | 'Consistent' | 'Strict';

  // Section 3: Training History
  S3_DURATION: 'Never' | '<6mo' | '6-12mo' | '1-2yr' | '2-5yr' | '5+yr';
  S3_COMPOUNDS: string[];
  S3_PROGRAM: boolean;
  S3_FREQUENCY: number;
  S3_1RM_AWARE?: boolean;
  S3_SQUAT_1RM?: number;
  S3_DEADLIFT_1RM?: number;
  S3_BENCH_1RM?: number;

  // Section 4: Goal Specification
  S4_PRIMARY: 'Strength' | 'Hypertrophy' | 'Endurance' | 'Power' | 'General_Health' | 'Recomposition';
  S4_SECONDARY?: 'Strength' | 'Hypertrophy' | 'Endurance' | 'Power' | 'General_Health' | 'Recomposition';
  S4_TIMELINE: '4' | '8' | '12' | '16' | '20+';
  S4_TARGET_AREAS?: string[];

  // Section 5: Availability
  S5_DAYS: number;
  S5_TIME: number;
  S5_GYM_TYPE: 'Home' | 'Commercial' | 'Outdoor';
  S5_SCHEDULE?: string[];

  // Section 6: Injury
  S6_CURRENT_INJURY: boolean;
  S6_INJURY_LIST?: string[];
  S6_PAIN_SCALE?: number;
  S6_PAST_SURGERY: boolean;
  S6_PHYSIO: boolean;

  // Section 7: Mobility (conditional: E >= 20)
  S7_SQUAT_DEPTH?: 'Yes' | 'No' | 'Only with raised heels';
  S7_OVERHEAD?: 'Yes' | 'No' | 'Partial';
  S7_HINGE?: 'Yes' | 'No' | 'Almost';
  S7_LUNGE?: 'Yes' | 'No' | 'Unstable';
  S7_ROTARY?: 'Yes' | 'No' | 'Limited';

  // Section 8: Preferences (conditional: E >= 35)
  S8_STYLE?: 'Free Weights' | 'Machines' | 'Calisthenics' | 'Mixed';
  S8_SPLIT?: 'Full Body' | 'Upper/Lower' | 'Push/Pull/Legs' | 'Bro Split' | 'Specialized' | 'Custom';
  S8_CARDIO?: 'None' | 'Low' | 'Moderate' | 'High';
  S8_DISLIKES?: string[];
  S8_RPE?: 'RPE' | '%1RM' | 'Neither';
}

export type SafetyFlag =
  | 'CARDIOVASCULAR_RISK'
  | 'MUSCULOSKELETAL_RISK'
  | 'PREGNANCY_POSTPARTUM'
  | 'METABOLIC_ADJUSTMENT'
  | 'MAX_HEART_RATE_REDUCED'
  | 'MEDICAL_CLEARANCE_REQUIRED'
  | 'POST_SURGICAL'
  | 'LOAD_RESTRICTION';
