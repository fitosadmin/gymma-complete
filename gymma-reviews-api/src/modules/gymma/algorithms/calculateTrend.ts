// src/modules/gymma/algorithms/calculateTrend.ts

export type TrendDirection = 'rising' | 'stable' | 'declining';

/**
 * Compares current Bayesian score to the most recent prior snapshot.
 * A ±1 point band counts as 'stable' to avoid noisy flip-flopping.
 * Returns null when there is no prior snapshot (first calculation).
 */
export function calculateTrend(
  currentScore: number,
  previousScore: number | null,
): TrendDirection | null {
  if (previousScore === null) return null;
  const delta = currentScore - previousScore;
  if (delta > 1) return 'rising';
  if (delta < -1) return 'declining';
  return 'stable';
}
