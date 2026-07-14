// src/modules/gymma/algorithms/calculateCredibilityWeight.ts

/**
 * Tenure weight based on membership length (report.md 4.3).
 * Longer members are more credible reviewers.
 */
export function calculateTenureWeight(
  startDate: string | Date | null,
  now: Date = new Date(),
): number {
  if (!startDate) return 0.7;
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const months = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  if (months > 12) return 1.0;
  if (months >= 6) return 0.9;
  if (months >= 3) return 0.8;
  return 0.7;
}

/**
 * Consistency weight — detects straightlining (giving identical answers to everything).
 * Uses std dev on normalized (0-1) scores. stdDev < 0.05 means near-zero variance = suspicious.
 */
export function calculateConsistencyWeight(rawScores: number[]): number {
  if (rawScores.length < 2) return 1.0;
  const normalized = rawScores.map((s) => s / 100);
  const mean = normalized.reduce((sum, s) => sum + s, 0) / normalized.length;
  const variance =
    normalized.reduce((sum, s) => sum + (s - mean) ** 2, 0) / normalized.length;
  const stdDev = Math.sqrt(variance);
  return stdDev < 0.05 ? 0.5 : 1.0;
}

/**
 * Speed weight — penalizes submissions completed in under 30 seconds.
 * < 30s = 0.5x (likely not reading the questions), 30s+ = 1.0x (report.md 4.3).
 */
export function calculateSpeedWeight(submissionTimeMs?: number): number {
  if (submissionTimeMs === undefined) return 1.0;
  return submissionTimeMs < 30_000 ? 0.5 : 1.0;
}

/**
 * Combines tenure, consistency, and speed into a single credibility weight.
 * Result is clamped to [0, 1].
 */
export function calculateCredibilityWeight(
  startDate: string | Date | null,
  rawScores: number[],
  submissionTimeMs?: number,
  now: Date = new Date(),
): number {
  const tenure = calculateTenureWeight(startDate, now);
  const consistency = calculateConsistencyWeight(rawScores);
  const speed = calculateSpeedWeight(submissionTimeMs);
  const combined = tenure * consistency * speed;
  return Math.round(Math.min(1, Math.max(0, combined)) * 100) / 100;
}
