import { EMOTION_LABELS } from "@shared/types/emotion.ts";
import type {
  EmotionLabel,
  EmotionProbabilities,
  EmotionScore,
  VADValues,
} from "@shared/types/emotion.ts";

const emotionLabelSet: ReadonlySet<string> = new Set(EMOTION_LABELS);

export function isEmotionLabel(value: string): value is EmotionLabel {
  return emotionLabelSet.has(value);
}

export interface EmotionAnalysisResult {
  readonly text: string;
  readonly emotions: {
    readonly categories: EmotionProbabilities;
    readonly vad: VADValues;
    readonly top_emotions: readonly EmotionScore[];
  };
  readonly processing_time_ms: number;
}

export function isEmotionAnalysisResult(
  data: unknown,
): data is EmotionAnalysisResult {
  if (typeof data !== "object" || data === null) return false;

  const obj = data as Record<string, unknown>;
  if (typeof obj.text !== "string") return false;
  if (typeof obj.processing_time_ms !== "number") return false;

  const emotions = obj.emotions;
  if (typeof emotions !== "object" || emotions === null) return false;

  const em = emotions as Record<string, unknown>;
  if (typeof em.categories !== "object" || em.categories === null) return false;
  if (typeof em.vad !== "object" || em.vad === null) return false;
  if (!Array.isArray(em.top_emotions)) return false;

  const vad = em.vad as Record<string, unknown>;
  if (typeof vad.valence !== "number") return false;
  if (typeof vad.arousal !== "number") return false;
  if (typeof vad.dominance !== "number") return false;

  return true;
}
