import { db } from "../db/index.ts";
import { emotionTemplates } from "../db/schema.ts";
import {
  ARKIT_BLENDSHAPES,
  createEmptyBlendshapeVector,
  isEmotionLabel,
  type BlendshapeVector,
  type EmotionLabel,
} from "../types/index.ts";
import { normalizeProbabilities } from "../utils/normalization.ts";

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
