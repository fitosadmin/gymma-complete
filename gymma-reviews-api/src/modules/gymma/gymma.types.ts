// src/modules/gymma/gymma.types.ts

export interface DimensionRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  weight: string; // NUMERIC comes back as string from pg
}

export interface PollQuestionRow {
  id: string;
  dimension_id: string;
  dimension_key: string;
  question_number: number;
  question_text: string;
  response_type: string;
  display_order: number;
}

export interface MembershipRow {
  id: string;
  status: string;
  start_date: string | null;
}

export interface SubmissionInsert {
  gymId: string;
  memberHash: string;
  credibilityWeight: number;
  responses: Record<string, number>;
  dimensionScores: Record<string, number>;
  rawScore: number;
  submissionTimeMs?: number;
}

export interface RecentSubmissionRow {
  id: string;
  created_at: string;
}

export interface GymScoreRow {
  gym_id: string;
  bayesian_score: string;
  raw_avg_score: string;
  tier: string;
  review_count: number;
  dimension_scores: Record<string, number>;
  bayesian_c: string;
  bayesian_m: number;
  trend_direction: string | null;
  last_calculated_at: string | null;
  tier_changed_at: string | null;
}

export interface ScoreHistoryRow {
  bayesian_score: string;
  tier: string;
  review_count: number;
  snapshot_date: string;
}

export interface LeaderboardRow {
  gym_id: string;
  bayesian_score: string;
  tier: string;
  review_count: number;
}

export interface EwmInputRow {
  gym_id: string;
  dimension_scores: Record<string, number>;
}

export interface SubmissionListRow {
  id: string;
  gym_id: string;
  member_hash: string;
  credibility_weight: string;
  raw_score: string;
  is_valid: boolean;
  created_at: string;
  total_count: string;
}

/** Converts PollQuestionRow[] to the shape the algorithm layer expects. */
export function toQuestionMeta(
  rows: { question_number: number; dimension_key: string; response_type: string }[],
): { questionNumber: number; dimensionKey: string; responseType: string }[] {
  return rows.map((r) => ({
    questionNumber: r.question_number,
    dimensionKey: r.dimension_key,
    responseType: r.response_type,
  }));
}
