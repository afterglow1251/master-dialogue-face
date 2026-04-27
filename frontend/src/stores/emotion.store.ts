import { defineStore } from "pinia";
import { computed, ref } from "vue";

import type { BlendshapeVector } from "@shared/types/blendshape";
import type {
  EmotionProbabilities,
  EmotionScore,
  VADValues,
} from "@shared/types/emotion";
import type { CombinedEmotionalState, MoodState } from "@shared/types/mood";

export const useEmotionStore = defineStore("emotion", () => {
  const currentBlendshapes = ref<BlendshapeVector | null>(null);
  const currentProbabilities = ref<EmotionProbabilities | null>(null);
  const currentVAD = ref<VADValues | null>(null);
  const topEmotions = ref<readonly EmotionScore[]>([]);
  const lastProcessingTimeMs = ref(0);

  const currentMood = ref<MoodState | null>(null);
  const combinedEmotions = ref<CombinedEmotionalState | null>(null);

  const dominantEmotion = computed(() => {
    if (topEmotions.value.length === 0) return null;
    return topEmotions.value[0] ?? null;
  });

  function updateFromAnalysis(data: {
    blendshapes: BlendshapeVector;
    categories: EmotionProbabilities;
    vad: VADValues;
    topEmotions: readonly EmotionScore[];
    processingTimeMs: number;
    mood?: MoodState;
    combinedEmotions?: CombinedEmotionalState;
  }) {
    currentBlendshapes.value = data.blendshapes;
    currentProbabilities.value = data.categories;
    currentVAD.value = data.vad;
    topEmotions.value = data.topEmotions;
    lastProcessingTimeMs.value = data.processingTimeMs;

    if (data.mood) currentMood.value = data.mood;
    if (data.combinedEmotions) combinedEmotions.value = data.combinedEmotions;
  }

  function updateMood(mood: MoodState) {
    currentMood.value = mood;
  }

  function reset() {
    currentBlendshapes.value = null;
    currentProbabilities.value = null;
    currentVAD.value = null;
    topEmotions.value = [];
    lastProcessingTimeMs.value = 0;
    currentMood.value = null;
    combinedEmotions.value = null;
  }

  return {
    currentBlendshapes,
    currentProbabilities,
    currentVAD,
    topEmotions,
    dominantEmotion,
    lastProcessingTimeMs,
    currentMood,
    combinedEmotions,
    updateFromAnalysis,
    updateMood,
    reset,
  };
});
