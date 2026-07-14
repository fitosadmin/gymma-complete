// src/modules/gymma/gymma.repository.ts
import { query, queryOne, withTransaction } from '../../shared/db/query';
import type {
  DimensionRow,
  PollQuestionRow,
  MembershipRow,
  SubmissionInsert,
  RecentSubmissionRow,
  GymScoreRow,
  ScoreHistoryRow,
  LeaderboardRow,
  EwmInputRow,
  SubmissionListRow,
} from './gymma.types';

// ---------------------------------------------------------------------------
// Dimensions
// ---------------------------------------------------------------------------

/** All dimensions — unfiltered. Used for admin visibility. */
export async function getDimensions(): Promise<DimensionRow[]> {
  return query<DimensionRow>(
    `SELECT id, key, name, description, weight::text AS weight
       FROM gymma_dimensions
      ORDER BY name ASC`,
  );
}

/** Scoring dimensions only (excludes 'meta'). Use this when building weight maps. */
export async function getScoringDimensions(): Promise<DimensionRow[]> {
  const all = await getDimensions();
  return all.filter((d) => d.key !== 'meta');
}

// ---------------------------------------------------------------------------
// Poll questions
// ---------------------------------------------------------------------------

export async function getActiveQuestions(): Promise<PollQuestionRow[]> {
  return query<PollQuestionRow>(
    `SELECT q.id, q.dimension_id, d.key AS dimension_key, q.question_number,
            q.question_text, q.response_type, q.display_order
       FROM gymma_poll_questions q
       JOIN gymma_dimensions d ON d.id = q.dimension_id
      WHERE q.is_active = true
      ORDER BY q.display_order ASC`,
  );
}

// ---------------------------------------------------------------------------
// Membership check (reuses existing gym_members table)
// ---------------------------------------------------------------------------

export async function findActiveMembership(
  gymId: string,
  userId: string,
): Promise<MembershipRow | null> {
  return queryOne<MembershipRow>(
    `SELECT id, status, start_date
       FROM gym_members
      WHERE gym_id = $1 AND user_id = $2 AND status = 'active' AND deleted_at IS NULL`,
    [gymId, userId],
  );
}

// ---------------------------------------------------------------------------
// Submissions
// ---------------------------------------------------------------------------

/** Cooldown check — most recent submission by this member_hash for this gym within the window. */
export async function findRecentSubmission(
  gymId: string,
  memberHash: string,
  cooldownDays: number,
): Promise<RecentSubmissionRow | null> {
  return queryOne<RecentSubmissionRow>(
    `SELECT id, created_at
       FROM gymma_submissions
      WHERE gym_id = $1 AND member_hash = $2
        AND created_at >= NOW() - ($3 || ' days')::interval
      ORDER BY created_at DESC
      LIMIT 1`,
    [gymId, memberHash, cooldownDays],
  );
}

/** Inserts a submission. Does NOT touch review_count — that is recalculateGymScore's job. */
export async function insertSubmission(data: SubmissionInsert): Promise<{ id: string }> {
  return withTransaction(async (client) => {
    const res = await client.query<{ id: string }>(
      `INSERT INTO gymma_submissions
         (gym_id, member_hash, credibility_weight, responses, dimension_scores,
          raw_score, submission_time_ms)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7)
       RETURNING id`,
      [
        data.gymId,
        data.memberHash,
        data.credibilityWeight,
        JSON.stringify(data.responses),
        JSON.stringify(data.dimensionScores),
        data.rawScore,
        data.submissionTimeMs ?? null,
      ],
    );
    return { id: res.rows[0].id };
  });
}

export async function getValidSubmissionsForGym(
  gymId: string,
  windowDays: number,
): Promise<{ dimension_scores: Record<string, number>; credibility_weight: string }[]> {
  return query(
    `SELECT dimension_scores, credibility_weight::text
       FROM gymma_submissions
      WHERE gym_id = $1 AND is_valid = true
        AND created_at >= NOW() - ($2 || ' days')::interval`,
    [gymId, windowDays],
  );
}

export async function listSubmissions(filters: {
  gymId?: string;
  flaggedOnly?: boolean;
  page: number;
  limit: number;
}): Promise<{ rows: SubmissionListRow[]; total: number }> {
  const params: unknown[] = [];
  const clauses: string[] = [];

  if (filters.gymId) {
    params.push(filters.gymId);
    clauses.push(`gym_id = $${params.length}`);
  }
  if (filters.flaggedOnly) {
    clauses.push(`credibility_weight < 1.00`);
  }
  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

  params.push(filters.limit, (filters.page - 1) * filters.limit);

  const rows = await query<SubmissionListRow>(
    `SELECT id, gym_id, member_hash, credibility_weight::text, raw_score::text,
            is_valid, created_at, COUNT(*) OVER()::text AS total_count
       FROM gymma_submissions
       ${where}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  return { rows, total };
}

export async function invalidateSubmission(
  id: string,
): Promise<{ gym_id: string } | null> {
  return queryOne<{ gym_id: string }>(
    `UPDATE gymma_submissions SET is_valid = false WHERE id = $1 RETURNING gym_id`,
    [id],
  );
}

// ---------------------------------------------------------------------------
// Gym scores
// ---------------------------------------------------------------------------

export async function getGymScore(gymId: string): Promise<GymScoreRow | null> {
  return queryOne<GymScoreRow>(
    `SELECT gym_id, bayesian_score::text, raw_avg_score::text, tier, review_count,
            dimension_scores, bayesian_c::text, bayesian_m, trend_direction,
            last_calculated_at, tier_changed_at
       FROM gymma_gym_scores
      WHERE gym_id = $1`,
    [gymId],
  );
}

export async function updateGymScore(
  gymId: string,
  data: {
    bayesianScore: number;
    rawAvgScore: number;
    tier: string;
    reviewCount: number;
    dimensionScores: Record<string, number>;
    trendDirection: 'rising' | 'stable' | 'declining' | null;
    tierChanged: boolean;
  },
): Promise<void> {
  await query(
    `UPDATE gymma_gym_scores
        SET bayesian_score = $2,
            raw_avg_score = $3,
            tier = $4,
            review_count = $5,
            dimension_scores = $6::jsonb,
            trend_direction = $7,
            last_calculated_at = NOW(),
            tier_changed_at = CASE WHEN $8 THEN NOW() ELSE tier_changed_at END
      WHERE gym_id = $1`,
    [
      gymId,
      data.bayesianScore,
      data.rawAvgScore,
      data.tier,
      data.reviewCount,
      JSON.stringify(data.dimensionScores),
      data.trendDirection,
      data.tierChanged,
    ],
  );
}

export async function listAllScoredGymIds(): Promise<string[]> {
  const rows = await query<{ gym_id: string }>(`SELECT gym_id FROM gymma_gym_scores`);
  return rows.map((r) => r.gym_id);
}

// ---------------------------------------------------------------------------
// Score history
// ---------------------------------------------------------------------------

export async function getScoreHistory(
  gymId: string,
  days: number,
): Promise<ScoreHistoryRow[]> {
  return query<ScoreHistoryRow>(
    `SELECT bayesian_score::text, tier, review_count, snapshot_date::text
       FROM gymma_score_history
      WHERE gym_id = $1 AND snapshot_date >= (CURRENT_DATE - ($2 || ' days')::interval)
      ORDER BY snapshot_date ASC`,
    [gymId, days],
  );
}

export async function insertScoreHistorySnapshot(
  gymId: string,
  bayesianScore: number,
  tier: string,
  reviewCount: number,
): Promise<void> {
  await query(
    `INSERT INTO gymma_score_history (gym_id, bayesian_score, tier, review_count, snapshot_date)
     VALUES ($1, $2, $3, $4, CURRENT_DATE)
     ON CONFLICT (gym_id, snapshot_date)
     DO UPDATE SET bayesian_score = $2, tier = $3, review_count = $4`,
    [gymId, bayesianScore, tier, reviewCount],
  );
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

export async function getLeaderboard(
  minReviews: number,
  limit: number,
  tierMin?: string,
): Promise<LeaderboardRow[]> {
  const params: unknown[] = [minReviews];
  let tierClause = '';
  if (tierMin) {
    params.push(tierMin);
    tierClause = `AND tier = $${params.length}`;
  }
  params.push(limit);

  return query<LeaderboardRow>(
    `SELECT gym_id, bayesian_score::text, tier, review_count
       FROM gymma_gym_scores
      WHERE review_count >= $1 AND tier != 'none' ${tierClause}
      ORDER BY bayesian_score DESC
      LIMIT $${params.length}`,
    params,
  );
}

// ---------------------------------------------------------------------------
// EWM (Entropy Weight Method) — batch weight recalculation
// ---------------------------------------------------------------------------

export async function getDimensionScoresForEwm(
  minReviews: number,
): Promise<EwmInputRow[]> {
  return query<EwmInputRow>(
    `SELECT gym_id, dimension_scores
       FROM gymma_gym_scores
      WHERE review_count >= $1`,
    [minReviews],
  );
}

export async function updateDimensionWeights(
  weights: Record<string, number>,
): Promise<void> {
  await withTransaction(async (client) => {
    for (const [key, weight] of Object.entries(weights)) {
      await client.query(
        `UPDATE gymma_dimensions SET weight = $2 WHERE key = $1`,
        [key, weight],
      );
    }
  });
}

export async function updateSingleDimensionWeight(
  key: string,
  weight: number,
): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `UPDATE gymma_dimensions SET weight = $2 WHERE key = $1 RETURNING id`,
    [key, weight],
  );
  return rows.length > 0;
}
