// src/modules/gymma/algorithms/calculateImprovementPriorities.ts

export interface ImprovementPriority {
  dimension: string;
  currentScore: number;
  gapToTarget: number;
  roiRank: number;
}

/**
 * ROI-ranked improvement list for gym owners (report.md 6.2).
 * Priority = gap to target × dimension weight.
 * Higher weight + higher gap = highest-impact area to focus on.
 * targetScore defaults to 80 (the report's "next tier" reference point).
 *
 * Dimensions already at/above target get gapToTarget=0 and rank last.
 */
export function calculateImprovementPriorities(
  dimensionScores: Record<string, number>,
  weights: Record<string, number>,
  targetScore = 80,
): ImprovementPriority[] {
  const scored = Object.entries(dimensionScores).map(([dimension, score]) => {
    const gap = Math.max(0, targetScore - score);
    const weight = weights[dimension] ?? 0;
    return {
      dimension,
      currentScore: score,
      gapToTarget: Math.round(gap * 100) / 100,
      roiScore: gap * weight,
    };
  });

  scored.sort((a, b) => b.roiScore - a.roiScore);

  return scored.map((s, i) => ({
    dimension: s.dimension,
    currentScore: s.currentScore,
    gapToTarget: s.gapToTarget,
    roiRank: i + 1,
  }));
}
