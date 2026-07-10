// src/modules/gymma/gymma.service.ts
import crypto from 'node:crypto';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AppError } from '../../shared/errors/AppError';
import * as repo from './gymma.repository';
import { toQuestionMeta } from './gymma.types';
import {
  normalizeResponses,
  calculateDimensionScores,
  calculateRawScore,
  calculateCredibilityWeight,
  calculateBayesianScore,
  calculateTier,
  calculateTrend,
  calculateEntropyWeights,
  calculateImprovementPriorities,
} from './algorithms';

const COOLDOWN_DAYS = 7;
const RECALC_WINDOW_DAYS = 365;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeMemberHash(userId: string, gymId: string): string {
  const salt = env.GYMMA_PLATFORM_SALT;
  return crypto.createHash('sha256').update(`${userId}:${gymId}:${salt}`).digest('hex');
}

// ---------------------------------------------------------------------------
// Public: health
// ---------------------------------------------------------------------------

export const getHealth = async () => ({ status: 'ok', module: 'gymma' });

// ---------------------------------------------------------------------------
// Public: poll
// ---------------------------------------------------------------------------

export const getPoll = async (gymId: string) => {
  const questions = await repo.getActiveQuestions();
  return {
    gym_id: gymId,
    questions: questions.map((q) => ({
      id: q.id,
      question_number: q.question_number,
      dimension: q.dimension_key,
      question_text: q.question_text,
      response_type: q.response_type,
      display_order: q.display_order,
    })),
  };
};

// ---------------------------------------------------------------------------
// Public: submit poll
// ---------------------------------------------------------------------------

export const submitPoll = async (
  userId: string,
  gymId: string,
  responses: Record<string, number>,
  submissionTimeMs?: number,
) => {
  const [membership, dimensions, questionRows] = await Promise.all([
    repo.findActiveMembership(gymId, userId),
    repo.getScoringDimensions(),
    repo.getActiveQuestions(),
  ]);

  if (!membership) {
    throw AppError.forbidden(
      'An active membership at this gym is required to submit a rating',
    );
  }

  const questions = toQuestionMeta(questionRows);

  let normalized: Map<number, number>;
  try {
    normalized = normalizeResponses(responses, questions);
  } catch (err) {
    throw AppError.validation((err as Error).message);
  }

  const memberHash = computeMemberHash(userId, gymId);

  const recent = await repo.findRecentSubmission(gymId, memberHash, COOLDOWN_DAYS);
  if (recent) {
    throw AppError.conflict(
      'You have already submitted a rating for this gym in the last 7 days',
    );
  }

  const dimensionScores = calculateDimensionScores(normalized, questions);
  const weights = Object.fromEntries(dimensions.map((d) => [d.key, Number(d.weight)]));
  const rawScore = calculateRawScore(dimensionScores, weights);
  const credibilityWeight = calculateCredibilityWeight(
    membership.start_date,
    Array.from(normalized.values()),
    submissionTimeMs,
  );

  const { id } = await repo.insertSubmission({
    gymId,
    memberHash,
    credibilityWeight,
    responses,
    dimensionScores,
    rawScore,
    submissionTimeMs,
  });

  logger.info({ gymId, submissionId: id, credibilityWeight }, 'gymma submission recorded');

  // Trigger async score recalculation — failure here must NOT fail the submission.
  recalculateGymScore(gymId).catch((err) => {
    logger.error({ err, gymId }, 'gymma post-submission recalculation failed');
  });

  return {
    submission_id: id,
    accepted: true,
    preliminary_impact: 'Your feedback has been recorded. Score will update within 24 hours.',
  };
};

// ---------------------------------------------------------------------------
// Public: gym score
// ---------------------------------------------------------------------------

export const getGymScore = async (gymId: string) => {
  const score = await repo.getGymScore(gymId);
  if (!score) throw AppError.notFound('No score data for this gym yet');
  return {
    gym_id: score.gym_id,
    bayesian_score: Number(score.bayesian_score),
    raw_avg_score: Number(score.raw_avg_score),
    tier: score.tier,
    review_count: score.review_count,
    dimension_scores: score.dimension_scores,
    trend_direction: score.trend_direction,
    last_calculated_at: score.last_calculated_at,
  };
};

// ---------------------------------------------------------------------------
// Public: dimension breakdown
// ---------------------------------------------------------------------------

export const getDimensionBreakdown = async (gymId: string) => {
  const score = await repo.getGymScore(gymId);
  if (!score) throw AppError.notFound('No score data for this gym yet');
  const dimensions = await repo.getScoringDimensions();
  const weights = Object.fromEntries(dimensions.map((d) => [d.key, Number(d.weight)]));
  return {
    gym_id: gymId,
    dimensions: Object.entries(score.dimension_scores).map(([key, value]) => ({
      dimension: key,
      score: value,
      weight: weights[key] ?? null,
    })),
  };
};

// ---------------------------------------------------------------------------
// Public: leaderboard
// ---------------------------------------------------------------------------

export const getLeaderboard = async (tierMin?: string, limit = 20) => {
  const rows = await repo.getLeaderboard(env.GYMMA_MIN_REVIEWS_PUBLIC, limit, tierMin);
  return rows.map((r) => ({
    gym_id: r.gym_id,
    bayesian_score: Math.round(Number(r.bayesian_score)),
    tier: r.tier,
    review_count: r.review_count,
  }));
};

// ---------------------------------------------------------------------------
// Public: score history
// ---------------------------------------------------------------------------

export const getHistory = async (gymId: string, days = 30) => {
  const rows = await repo.getScoreHistory(gymId, days);
  return {
    gym_id: gymId,
    history: rows.map((r) => ({
      date: r.snapshot_date,
      score: Number(r.bayesian_score),
      tier: r.tier,
      review_count: r.review_count,
    })),
  };
};

// ---------------------------------------------------------------------------
// Core: recalculate a single gym's score
// ---------------------------------------------------------------------------

export const recalculateGymScore = async (gymId: string) => {
  const [submissions, dimensions, currentScore, history] = await Promise.all([
    repo.getValidSubmissionsForGym(gymId, RECALC_WINDOW_DAYS),
    repo.getScoringDimensions(),
    repo.getGymScore(gymId),
    repo.getScoreHistory(gymId, 30),
  ]);

  if (!currentScore) {
    throw AppError.notFound('No score row exists for this gym — has it been seeded?');
  }

  if (submissions.length === 0) {
    logger.info({ gymId }, 'gymma recalculation skipped: no valid submissions');
    return {
      gymId,
      oldScore: Number(currentScore.bayesian_score),
      newScore: Number(currentScore.bayesian_score),
      oldTier: currentScore.tier,
      newTier: currentScore.tier,
      reviewCount: 0,
    };
  }

  // Credibility-weighted average per dimension across all valid submissions.
  const weightedSums: Record<string, number> = {};
  const weightTotals: Record<string, number> = {};
  for (const sub of submissions) {
    const credibility = Number(sub.credibility_weight);
    for (const [dimension, score] of Object.entries(sub.dimension_scores)) {
      weightedSums[dimension] = (weightedSums[dimension] ?? 0) + score * credibility;
      weightTotals[dimension] = (weightTotals[dimension] ?? 0) + credibility;
    }
  }
  const avgDimensionScores: Record<string, number> = {};
  for (const dimension of Object.keys(weightedSums)) {
    avgDimensionScores[dimension] =
      weightTotals[dimension] > 0
        ? Math.round((weightedSums[dimension] / weightTotals[dimension]) * 100) / 100
        : 0;
  }

  const weights = Object.fromEntries(dimensions.map((d) => [d.key, Number(d.weight)]));
  let rawAvgScore = 0;
  for (const [dimension, score] of Object.entries(avgDimensionScores)) {
    rawAvgScore += score * (weights[dimension] ?? 0);
  }
  rawAvgScore = Math.round(rawAvgScore * 100) / 100;

  const reviewCount = submissions.length;
  const bayesianScore = calculateBayesianScore(
    rawAvgScore,
    reviewCount,
    env.GYMMA_BAYESIAN_M,
    env.GYMMA_BAYESIAN_C,
  );
  const proposedTier = calculateTier(bayesianScore, reviewCount, env.GYMMA_MIN_REVIEWS_PUBLIC);

  // Tier stabilization: only commit a tier change after TIER_STABILIZATION_DAYS.
  let finalTier = currentScore.tier;
  let tierChanged = false;
  if (proposedTier !== currentScore.tier) {
    const changedAt = currentScore.tier_changed_at
      ? new Date(currentScore.tier_changed_at)
      : null;
    const daysSinceChange = changedAt
      ? (Date.now() - changedAt.getTime()) / 86_400_000
      : Infinity;
    const isFirstAssignment = currentScore.tier === 'none';
    if (isFirstAssignment || daysSinceChange >= env.GYMMA_TIER_STABILIZATION_DAYS) {
      finalTier = proposedTier;
      tierChanged = true;
    }
  }

  const previousSnapshot =
    history.length > 0 ? Number(history[history.length - 1].bayesian_score) : null;
  const trend = calculateTrend(bayesianScore, previousSnapshot);

  await repo.updateGymScore(gymId, {
    bayesianScore,
    rawAvgScore,
    tier: finalTier,
    reviewCount,
    dimensionScores: avgDimensionScores,
    trendDirection: trend,
    tierChanged,
  });
  await repo.insertScoreHistorySnapshot(gymId, bayesianScore, finalTier, reviewCount);

  logger.info(
    { gymId, oldScore: currentScore.bayesian_score, newScore: bayesianScore, tierChanged },
    'gymma score recalculated',
  );

  return {
    gymId,
    oldScore: Number(currentScore.bayesian_score),
    newScore: bayesianScore,
    oldTier: currentScore.tier,
    newTier: finalTier,
    reviewCount,
  };
};

// ---------------------------------------------------------------------------
// Owner: dashboard
// ---------------------------------------------------------------------------

export const getOwnerDashboard = async (gymId: string) => {
  const [score, dimensions, history] = await Promise.all([
    repo.getGymScore(gymId),
    repo.getScoringDimensions(),
    repo.getScoreHistory(gymId, 30),
  ]);

  if (!score) throw AppError.notFound('No Gymma score data for this gym yet');

  const weights = Object.fromEntries(dimensions.map((d) => [d.key, Number(d.weight)]));
  const priorities = calculateImprovementPriorities(score.dimension_scores, weights);

  return {
    gym_id: gymId,
    bayesian_score: Number(score.bayesian_score),
    raw_avg_score: Number(score.raw_avg_score),
    tier: score.tier,
    review_count: score.review_count,
    trend_direction: score.trend_direction,
    dimension_breakdown: Object.entries(score.dimension_scores).map(([key, value]) => ({
      dimension: key,
      score: value,
      weight: weights[key] ?? null,
    })),
    improvement_priorities: priorities.slice(0, 3),
    score_history_30d: history.map((h) => ({
      date: h.snapshot_date,
      score: Number(h.bayesian_score),
    })),
    last_calculated_at: score.last_calculated_at,
  };
};

// ---------------------------------------------------------------------------
// Admin: bulk recalculation
// ---------------------------------------------------------------------------

export const recalculateAllGyms = async () => {
  const gymIds = await repo.listAllScoredGymIds();
  const results = [];
  for (const gymId of gymIds) {
    try {
      results.push(await recalculateGymScore(gymId));
    } catch (err) {
      logger.error({ err, gymId }, 'gymma bulk recalculation failed for gym');
    }
  }
  return { recalculated: results.length, total: gymIds.length, results };
};

// ---------------------------------------------------------------------------
// Admin: dimension management
// ---------------------------------------------------------------------------

export const getAdminDimensions = async () => {
  const dims = await repo.getDimensions();
  return dims.map((d) => ({ ...d, scoring: d.key !== 'meta' }));
};

export const updateDimensionWeight = async (key: string, weight: number) => {
  const updated = await repo.updateSingleDimensionWeight(key, weight);
  if (!updated) throw AppError.notFound(`Unknown dimension key: ${key}`);
  return { key, weight, updated: true };
};

// ---------------------------------------------------------------------------
// Admin: EWM recalculation
// ---------------------------------------------------------------------------

export const runEwmRecalculation = async () => {
  const rows = await repo.getDimensionScoresForEwm(env.GYMMA_MIN_REVIEWS_PUBLIC);
  if (rows.length === 0) {
    throw AppError.conflict(
      'No gyms meet the minimum review threshold for EWM recalculation',
    );
  }
  const dimensionKeys = ['equipment', 'cleanliness', 'staff', 'environment', 'value', 'safety'];
  const matrix = rows.map((r) => dimensionKeys.map((key) => r.dimension_scores[key] ?? 0));

  const weights = calculateEntropyWeights(matrix, dimensionKeys);
  await repo.updateDimensionWeights(weights);

  logger.info({ weights, gymsUsed: rows.length }, 'gymma EWM weights recalculated');
  return { weights, gymsUsed: rows.length };
};

// ---------------------------------------------------------------------------
// Admin: submission moderation
// ---------------------------------------------------------------------------

export const listSubmissionsForModeration = async (filters: {
  gymId?: string;
  flaggedOnly?: boolean;
  page: number;
  limit: number;
}) => {
  const { rows, total } = await repo.listSubmissions(filters);
  return {
    data: rows.map((r) => ({
      id: r.id,
      gym_id: r.gym_id,
      member_hash: r.member_hash,
      credibility_weight: Number(r.credibility_weight),
      raw_score: Number(r.raw_score),
      is_valid: r.is_valid,
      created_at: r.created_at,
    })),
    meta: { page: filters.page, limit: filters.limit, total },
  };
};

export const invalidateSubmission = async (submissionId: string) => {
  const result = await repo.invalidateSubmission(submissionId);
  if (!result) throw AppError.notFound('Submission not found');
  // Recalculate the affected gym's score after invalidation.
  await recalculateGymScore(result.gym_id);
  return { invalidated: true, gym_id: result.gym_id };
};
