import {
  EMOTION_LABELS,
  createEmptyProbabilities,
  type EmotionProbabilities,
} from "../types/index.ts";

/**
 * Formula 1 — probability normalization.
 *
 *   p̂ᵢ = pᵢ / Σⱼ pⱼ
 *
 *   Σⱼ pⱼ = 0  ⇒  p̂_neutral = 1
 *
 * ──
 *
 * Формула 1 — нормалізація ймовірностей.
 *
 *   Якщо сума всіх ймовірностей нульова, результат — чистий нейтральний
 *   розподіл: p̂_neutral = 1.
 */
export function normalizeProbabilities(
  probabilities: EmotionProbabilities,
): EmotionProbabilities {
  let sum = 0;
  for (const label of EMOTION_LABELS) {
    sum += probabilities[label];
  }

  const result = createEmptyProbabilities();

  if (sum === 0) {
    result.neutral = 1;
    return result;
  }

  for (const label of EMOTION_LABELS) {
    result[label] = probabilities[label] / sum;
  }

  return result;
}
