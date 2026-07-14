// src/modules/gymma/algorithms/normalizeResponses.ts

export interface QuestionMeta {
  questionNumber: number;
  dimensionKey: string;
  responseType: string;
}

/**
 * Validates a raw submission payload against the active question set:
 * - every active question must be answered
 * - no unknown question numbers allowed
 * - every score must be an integer 0-100 in steps of 5
 *
 * Steps of 5 (not 10) because the 5-point response types (likert5, overall5,
 * frequency5) map their points to 0/25/50/75/100 — 25 and 75 aren't
 * multiples of 10, so a %10 check would reject every valid 5-point
 * submission. nps11 (0/10/…/100) and binary3 (0/50/100) are still covered,
 * since both are also multiples of 5.
 *
 * Returns a clean numeric Map keyed by question number.
 * Throws plain Error on invalid input — the service layer translates to AppError.
 */
export function normalizeResponses(
  raw: Record<string, number>,
  questions: QuestionMeta[],
): Map<number, number> {
  const validNumbers = new Set(questions.map((q) => q.questionNumber));
  const normalized = new Map<number, number>();

  for (const [key, value] of Object.entries(raw)) {
    const questionNumber = Number(key);
    if (!Number.isInteger(questionNumber) || !validNumbers.has(questionNumber)) {
      throw new Error(`Unknown or inactive question number: ${key}`);
    }
    if (!Number.isFinite(value) || value < 0 || value > 100 || value % 5 !== 0) {
      throw new Error(`Invalid score for question ${key}: must be 0-100 in steps of 5`);
    }
    normalized.set(questionNumber, value);
  }

  for (const q of questions) {
    if (!normalized.has(q.questionNumber)) {
      throw new Error(`Missing response for question ${q.questionNumber}`);
    }
  }

  return normalized;
}
