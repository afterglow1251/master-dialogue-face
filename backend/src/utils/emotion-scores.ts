import {
  createEmptyProbabilities,
  isEmotionLabel,
  type EmotionProbabilities,
} from "../types/index.ts";

export function toEmotionProbabilities(
  scores: readonly { readonly label: string; readonly score: number }[],
): EmotionProbabilities {
  const result = createEmptyProbabilities();
  for (const { label, score } of scores) {
    if (isEmotionLabel(label)) result[label] = score;
  }
  return result;
}
