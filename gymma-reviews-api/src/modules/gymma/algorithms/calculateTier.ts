// src/modules/gymma/algorithms/calculateTier.ts

export type GymmaTier = 'none' | 'GYMM-A' | 'GYMM-AA' | 'GYMM-AAA' | 'GYMM-Elite';

/**
 * Maps a Bayesian score to a public tier badge (report.md Table 3).
 * A gym below minReviewsForBadge always returns 'none', regardless of score —
 * this prevents newly joined gyms with 1-2 five-star submissions from gaming the tier.
 *
 * Score bands:
 *   90-100  → GYMM-Elite
 *   80-89   → GYMM-AAA
 *   70-79   → GYMM-AA
 *   60-69   → GYMM-A
 *   < 60    → none
 */
export function calculateTier(
  bayesianScore: number,
  reviewCount: number,
  minReviewsForBadge: number,
): GymmaTier {
  if (reviewCount < minReviewsForBadge) return 'none';
  if (bayesianScore >= 90) return 'GYMM-Elite';
  if (bayesianScore >= 80) return 'GYMM-AAA';
  if (bayesianScore >= 70) return 'GYMM-AA';
  if (bayesianScore >= 60) return 'GYMM-A';
  return 'none';
}
