export const EMOTION_LABELS = [
  "admiration",
  "amusement",
  "anger",
  "annoyance",
  "approval",
  "caring",
  "confusion",
  "curiosity",
  "desire",
  "disappointment",
  "disapproval",
  "disgust",
  "embarrassment",
  "excitement",
  "fear",
  "gratitude",
  "grief",
  "joy",
  "love",
  "nervousness",
  "optimism",
  "pride",
  "realization",
  "relief",
  "remorse",
  "sadness",
  "surprise",
] as const;

export type EmotionLabel = (typeof EMOTION_LABELS)[number];

export type EmotionProbabilities = Record<EmotionLabel, number>;

export interface VADValues {
  readonly valence: number;
  readonly arousal: number;
  readonly dominance: number;
}

export interface EmotionScore {
  readonly name: EmotionLabel;
  readonly probability: number;
}
