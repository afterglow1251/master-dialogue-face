import { db } from "../db/index.ts";
import { emotionTemplates } from "../db/schema.ts";
import {
  isEmotionLabel,
  type BlendshapeVector,
  type BlendshapesByMode,
  type EmotionLabel,
  type EmotionProbabilities,
  type ExpressionMode,
} from "../types/index.ts";
import {
  DEFAULT_INTENSITY_MULTIPLIER,
  SYMMETRIC_SEED,
  composeExpression,
  mixBlendshapeTemplates,
} from "@shared/math/index.ts";

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

export function mapEmotionsToBlendshapes(
  probabilities: EmotionProbabilities,
  intensityMultiplier = DEFAULT_INTENSITY_MULTIPLIER,
): BlendshapeVector {
  return mixBlendshapeTemplates(
    probabilities,
    templateCache,
    intensityMultiplier,
  );
}

export interface ExpressionOptions {
  readonly mode: ExpressionMode;
  readonly intensityMultiplier?: number | undefined;
  readonly asymmetrySeed?: number | undefined;
}

export function mapEmotionsByMode(
  probabilities: EmotionProbabilities,
  options: Omit<ExpressionOptions, "mode">,
): BlendshapesByMode {
  return {
    linear: mapEmotions(probabilities, { ...options, mode: "linear" }),
    facs: mapEmotions(probabilities, { ...options, mode: "facs" }),
  };
}

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
