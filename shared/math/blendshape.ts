import {
  ARKIT_BLENDSHAPES,
  EMOTION_LABELS,
  createEmptyBlendshapeVector,
  type BlendshapeVector,
  type EmotionLabel,
  type EmotionProbabilities,
} from "../types/index.ts";
import { clamp01 } from "./clamp.ts";
import { DEFAULT_INTENSITY_MULTIPLIER } from "./constants.ts";
import { normalizeProbabilities } from "./normalization.ts";

/**
 * Formula 2 — linear blendshape mixing.
 *
 *   Bⱼ = clamp₀₁( m · Σᵢ p̂ᵢ · Tᵢⱼ ),   j = 1..52
 *
 *   p̂ᵢ — normalized probability of emotion i (formula 1)
 *   Tᵢⱼ — template matrix, emotion i → blendshape j (27 × 52)
 *   m  — expression intensity multiplier
 *
 * ──
 *
 * Формула 2 — лінійне змішування шаблонів blendshape.
 *
 *   p̂ᵢ — нормалізована ймовірність емоції i (формула 1)
 *   Tᵢⱼ — матриця шаблонів, емоція i → параметр blendshape j (27 × 52)
 *   m  — коефіцієнт інтенсивності виразу
 */
export function mixBlendshapeTemplates(
  probabilities: EmotionProbabilities,
  templates: ReadonlyMap<EmotionLabel, BlendshapeVector>,
  intensityMultiplier = DEFAULT_INTENSITY_MULTIPLIER,
): BlendshapeVector {
  const normalized = normalizeProbabilities(probabilities);
  const result = createEmptyBlendshapeVector();

  for (const label of EMOTION_LABELS) {
    const template = templates.get(label);
    if (!template) continue;

    const weight = normalized[label];
    for (const name of ARKIT_BLENDSHAPES) {
      result[name] += weight * template[name];
    }
  }

  for (const name of ARKIT_BLENDSHAPES) {
    result[name] = clamp01(result[name] * intensityMultiplier);
  }

  return result;
}
