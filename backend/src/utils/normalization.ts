import type { EmotionLabel } from "../types/index.ts";

/**
 * Normalizes multi-label probabilities so they sum to 1.
 *
 * Formula: p_i_norm = p_i / sum(p_j)
 * When every probability is zero the result is a pure neutral distribution.
 */
export function normalizeProbabilities(
  probabilities: Record<EmotionLabel, number>,
): Record<EmotionLabel, number> {
  const entries = Object.entries(probabilities) as Array<
    [EmotionLabel, number]
  >;

  const sum = entries.reduce((acc, [, val]) => acc + val, 0);

  if (sum === 0) {
    return Object.fromEntries(
      entries.map(([key]) => [key, key === "neutral" ? 1 : 0]),
    ) as Record<EmotionLabel, number>;
  }

  return Object.fromEntries(
    entries.map(([key, val]) => [key, val / sum]),
  ) as Record<EmotionLabel, number>;
}
