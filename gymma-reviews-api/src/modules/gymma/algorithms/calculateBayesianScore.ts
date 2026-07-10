// src/modules/gymma/algorithms/calculateBayesianScore.ts

/**
 * IMDB-style Bayesian weighted average (report.md 4.3).
 * Prevents gyms with few reviews from landing at score extremes.
 *
 * Formula: (v / (v + m)) * R + (m / (v + m)) * C
 *   R = gym's raw average score
 *   v = number of reviews for this gym
 *   m = minimum reviews for full credibility (GYMMA_BAYESIAN_M, default 30)
 *   C = global mean score across all gyms (GYMMA_BAYESIAN_C, default 50)
 */
export function calculateBayesianScore(
  rawAvgScore: number,
  reviewCount: number,
  m: number,
  c: number,
): number {
  if (reviewCount <= 0) return c;
  const v = reviewCount;
  const score = (v / (v + m)) * rawAvgScore + (m / (v + m)) * c;
  return Math.round(score * 100) / 100;
}
