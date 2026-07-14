// src/modules/gymma/algorithms/calculateDimensionScores.ts
import type { QuestionMeta } from './normalizeResponses';

/**
 * The six canonical rating dimensions. Q14 (NPS) and Q15 (Overall) belong to
 * the 'meta' dimension and are intentionally excluded from scoring.
 * 'meta' must never be added to this set.
 */
const CANONICAL_DIMENSIONS = new Set([
  'equipment', 'cleanliness', 'staff', 'environment', 'value', 'safety',
]);

/**
 * Aggregates question-level scores into per-dimension averages (report.md 4.1).
 * Uses a simple arithmetic mean — no weighting at this layer.
 * Non-canonical dimensions (e.g. 'meta') are silently skipped.
 */
export function calculateDimensionScores(
  normalized: Map<number, number>,
  questions: QuestionMeta[],
): Record<string, number> {
  const byDimension = new Map<string, number[]>();

  for (const q of questions) {
    if (!CANONICAL_DIMENSIONS.has(q.dimensionKey)) continue;
    const score = normalized.get(q.questionNumber);
    if (score === undefined) continue;
    const bucket = byDimension.get(q.dimensionKey) ?? [];
    bucket.push(score);
    byDimension.set(q.dimensionKey, bucket);
  }

  const result: Record<string, number> = {};
  for (const [dimension, scores] of byDimension) {
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    result[dimension] = Math.round(avg * 100) / 100;
  }
  return result;
}

/**
 * S_raw = Σ(w_j × d_j) — weighted sum of dimension scores (report.md 4.3).
 * Dimensions without a weight entry contribute 0 (defensive guard).
 */
export function calculateRawScore(
  dimensionScores: Record<string, number>,
  weights: Record<string, number>,
): number {
  let total = 0;
  for (const [dimension, score] of Object.entries(dimensionScores)) {
    total += score * (weights[dimension] ?? 0);
  }
  return Math.round(total * 100) / 100;
}
