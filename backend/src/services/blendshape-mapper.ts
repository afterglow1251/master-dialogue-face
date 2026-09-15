import { db } from "../db/index.ts";
import { emotionTemplates } from "../db/schema.ts";
import {
  ARKIT_BLENDSHAPES,
  createEmptyBlendshapeVector,
  isEmotionLabel,
  type BlendshapeVector,
  type EmotionLabel,
  type EmotionProbabilities,
  type ExpressionMode,
} from "../types/index.ts";
import { normalizeProbabilities } from "../utils/normalization.ts";
import { composeExpression } from "./expression-composer.ts";

export type { ExpressionMode };

const templateCache = new Map<EmotionLabel, BlendshapeVector>();

export async function loadTemplates(): Promise<void> {
  const rows = await db.select().from(emotionTemplates);

  templateCache.clear();
  for (const row of rows) {
    if (isEmotionLabel(row.emotionName)) {
      templateCache.set(row.emotionName, row.blendshapeVector);
    }
  }

  console.log(`Loaded ${templateCache.size} emotion templates.`);
}

/**
 * Maps emotion probabilities to 52 ARKit blendshape parameters.
 *
 * Formula: B_j = sum(p_i_norm * T_i_j) for i=1..27, j=1..52
 * Result is clamped to [0.0, 1.0].
 */
export function mapEmotionsToBlendshapes(
  probabilities: Record<EmotionLabel, number>,
  intensityMultiplier = 1.0,
): BlendshapeVector {
  const normalized = normalizeProbabilities(probabilities);

  const result = createEmptyBlendshapeVector();

  for (const [emotion, weight] of Object.entries(normalized)) {
    if (!isEmotionLabel(emotion)) continue;
    const template = templateCache.get(emotion);
    if (!template) continue;

    for (const bs of ARKIT_BLENDSHAPES) {
      result[bs] += weight * template[bs];
    }
  }

  for (const bs of ARKIT_BLENDSHAPES) {
    result[bs] = Math.min(1.0, Math.max(0.0, result[bs] * intensityMultiplier));
  }

  return result;
}

export interface ExpressionOptions {
  readonly mode: ExpressionMode;
  readonly intensityMultiplier?: number | undefined;
  readonly asymmetrySeed?: number | undefined;
}

const DEFAULT_INTENSITY_MULTIPLIER = 1.0;
const SYMMETRIC_SEED = 0;

export function mapEmotions(
  probabilities: EmotionProbabilities,
  options: ExpressionOptions,
): BlendshapeVector {
  const intensityMultiplier =
    options.intensityMultiplier ?? DEFAULT_INTENSITY_MULTIPLIER;

  switch (options.mode) {
    case "linear":
      return mapEmotionsToBlendshapes(probabilities, intensityMultiplier);
    case "facs":
      return composeExpression(
        probabilities,
        intensityMultiplier,
        options.asymmetrySeed ?? SYMMETRIC_SEED,
      );
    default: {
      const unreachable: never = options.mode;
      return unreachable;
    }
  }
}
