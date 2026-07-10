// src/modules/gymma/algorithms/calculateEntropyWeights.ts

/**
 * Entropy Weight Method (report.md 4.2).
 * Determines dimension weights objectively from actual score variance across gyms.
 * Dimensions with higher dispersion carry more discriminatory information → higher weight.
 *
 * This is a cross-gym batch computation, not part of the per-submission flow.
 * Intended for the quarterly recalculation job.
 *
 * @param matrix  rows = gyms, columns = dimensions; matrix[i][j] = gym i's avg score on dimension j
 * @param dimensionKeys  column labels, same order as matrix columns
 */
export function calculateEntropyWeights(
  matrix: number[][],
  dimensionKeys: string[],
): Record<string, number> {
  const n = matrix.length;
  const k = dimensionKeys.length;

  if (n === 0 || k === 0) {
    // No data yet — fall back to equal weights (matches DB seed default 0.1667).
    const equal = 1 / (k || 1);
    return Object.fromEntries(dimensionKeys.map((key) => [key, equal]));
  }

  // Step 1: normalize each column so it sums to 1.
  const columnSums = new Array(k).fill(0);
  for (const row of matrix) {
    for (let j = 0; j < k; j++) columnSums[j] += row[j];
  }
  const p: number[][] = matrix.map((row) =>
    row.map((val, j) => (columnSums[j] === 0 ? 0 : val / columnSums[j])),
  );

  // Step 2: Shannon entropy per dimension. Guard against ln(n)=0 when n=1.
  const lnN = Math.log(n);
  const entropy = new Array(k).fill(0);
  for (let j = 0; j < k; j++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const pij = p[i][j];
      if (pij > 0) sum += pij * Math.log(pij);
    }
    entropy[j] = lnN === 0 ? 1 : -(1 / lnN) * sum;
  }

  // Step 3: information redundancy (1 - entropy).
  const redundancy = entropy.map((e) => 1 - e);

  // Step 4: normalize redundancy into weights summing to 1.
  const redundancySum = redundancy.reduce((sum, d) => sum + d, 0);
  const weights =
    redundancySum === 0
      ? redundancy.map(() => 1 / k) // all dimensions equally uninformative
      : redundancy.map((d) => d / redundancySum);

  return Object.fromEntries(
    dimensionKeys.map((key, j) => [key, Math.round(weights[j] * 10000) / 10000]),
  );
}
