/**
 * VAD (Valence–Arousal–Dominance) reference centroids for 27 GoEmotions categories.
 * Source: NRC Valence, Arousal, and Dominance (VAD) Lexicon v1
 * Author: Saif M. Mohammad (2018)
 * Scale: 0.0 – 1.0
 */

import type { EmotionLabel, VADValues } from "../types/index.ts";

export const EMOTION_VAD_CENTROIDS: ReadonlyMap<
  EmotionLabel,
  Readonly<VADValues>
> = new Map([
  ["admiration", { valence: 0.969, arousal: 0.583, dominance: 0.726 }],
  ["amusement", { valence: 0.929, arousal: 0.837, dominance: 0.803 }],
  ["anger", { valence: 0.167, arousal: 0.865, dominance: 0.657 }],
  ["annoyance", { valence: 0.167, arousal: 0.718, dominance: 0.342 }],
  ["approval", { valence: 0.854, arousal: 0.46, dominance: 0.889 }],
  ["caring", { valence: 0.635, arousal: 0.469, dominance: 0.5 }],
  ["confusion", { valence: 0.255, arousal: 0.667, dominance: 0.277 }],
  ["curiosity", { valence: 0.75, arousal: 0.755, dominance: 0.463 }],
  ["desire", { valence: 0.896, arousal: 0.692, dominance: 0.647 }],
  ["disappointment", { valence: 0.115, arousal: 0.49, dominance: 0.336 }],
  ["disapproval", { valence: 0.085, arousal: 0.551, dominance: 0.367 }],
  ["disgust", { valence: 0.052, arousal: 0.775, dominance: 0.317 }],
  ["embarrassment", { valence: 0.143, arousal: 0.685, dominance: 0.226 }],
  ["excitement", { valence: 0.896, arousal: 0.684, dominance: 0.731 }],
  ["fear", { valence: 0.073, arousal: 0.84, dominance: 0.293 }],
  ["gratitude", { valence: 0.885, arousal: 0.441, dominance: 0.61 }],
  ["grief", { valence: 0.07, arousal: 0.64, dominance: 0.474 }],
  ["joy", { valence: 0.98, arousal: 0.824, dominance: 0.794 }],
  ["love", { valence: 1.0, arousal: 0.519, dominance: 0.673 }],
  ["nervousness", { valence: 0.163, arousal: 0.915, dominance: 0.241 }],
  ["optimism", { valence: 0.949, arousal: 0.565, dominance: 0.814 }],
  ["pride", { valence: 0.729, arousal: 0.634, dominance: 0.848 }],
  ["realization", { valence: 0.554, arousal: 0.51, dominance: 0.836 }],
  ["relief", { valence: 0.844, arousal: 0.278, dominance: 0.481 }],
  ["remorse", { valence: 0.103, arousal: 0.673, dominance: 0.377 }],
  ["sadness", { valence: 0.052, arousal: 0.288, dominance: 0.164 }],
  ["surprise", { valence: 0.875, arousal: 0.875, dominance: 0.562 }],
]);
