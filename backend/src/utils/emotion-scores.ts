import { isEmotionLabel, type EmotionProbabilities } from "../types/index.ts";

const CONTEXT_SEPARATOR = " </s> ";

export function buildModelInput(
  text: string,
  context: readonly string[],
): string {
  if (context.length === 0) return text;
  return [text, ...context].join(CONTEXT_SEPARATOR);
}

export function toEmotionProbabilities(
  scores: readonly { readonly label: string; readonly score: number }[],
): EmotionProbabilities {
  const result = createEmptyProbabilities();
  for (const { label, score } of scores) {
    if (isEmotionLabel(label)) result[label] = score;
  }
  return result;
}

function createEmptyProbabilities(): EmotionProbabilities {
  return {
    admiration: 0,
    amusement: 0,
    anger: 0,
    annoyance: 0,
    approval: 0,
    caring: 0,
    confusion: 0,
    curiosity: 0,
    desire: 0,
    disappointment: 0,
    disapproval: 0,
    disgust: 0,
    embarrassment: 0,
    excitement: 0,
    fear: 0,
    gratitude: 0,
    grief: 0,
    joy: 0,
    love: 0,
    nervousness: 0,
    optimism: 0,
    pride: 0,
    realization: 0,
    relief: 0,
    remorse: 0,
    sadness: 0,
    surprise: 0,
  };
}
