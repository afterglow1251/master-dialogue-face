import type {
  EmotionProbabilities,
  EmotionScore,
  VADValues,
} from "./emotion.ts";

/** Persistent mood state for a dialogue (ALMA mood layer) */
export interface MoodState {
  readonly vad: VADValues;
  readonly categories: EmotionProbabilities;
  readonly topEmotions: readonly EmotionScore[];
  readonly turnsSinceReset: number;
}

/** Combined emotional state: emotion layer + mood layer */
export interface CombinedEmotionalState {
  readonly categories: EmotionProbabilities;
  readonly topEmotions: readonly EmotionScore[];
  readonly vad: VADValues;
}

/** Mood parameters that are user-configurable */
export interface MoodParameters {
  readonly moodReactivity: number;
  readonly moodDecaySeconds: number;
  readonly emotionWeight: number;
}

/** Neutral VAD origin — resting emotional state */
export const NEUTRAL_VAD: Readonly<VADValues> = {
  valence: 0.5,
  arousal: 0.3,
  dominance: 0.5,
} as const;
