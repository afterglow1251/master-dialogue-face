import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import { watchEffect, watch } from "vue";

import { i18n, type Locale } from "@/lib/i18n";
import {
  DEFAULT_EXPRESSION_INTENSITY,
  DEFAULT_SMOOTHING_ALPHA,
  DEFAULT_MOOD_REACTIVITY,
  DEFAULT_MOOD_DECAY_SECONDS,
  DEFAULT_EMOTION_WEIGHT,
} from "@/utils/constants";

export const useSettingsStore = defineStore("settings", () => {
  const smoothingAlpha = useLocalStorage(
    "settings:smoothingAlpha",
    DEFAULT_SMOOTHING_ALPHA,
  );
  const expressionIntensity = useLocalStorage(
    "settings:expressionIntensity",
    DEFAULT_EXPRESSION_INTENSITY,
  );
  const moodReactivity = useLocalStorage(
    "settings:moodReactivity",
    DEFAULT_MOOD_REACTIVITY,
  );
  const moodDecaySeconds = useLocalStorage(
    "settings:moodDecaySeconds",
    DEFAULT_MOOD_DECAY_SECONDS,
  );
  const emotionWeight = useLocalStorage(
    "settings:emotionWeight",
    DEFAULT_EMOTION_WEIGHT,
  );

  const isDark = useLocalStorage("settings:isDark", false);
  const locale = useLocalStorage<Locale>("settings:locale", "uk");

  watchEffect(() => {
    document.documentElement.classList.toggle("dark", isDark.value);
  });

  watch(
    locale,
    (val) => {
      i18n.global.locale.value = val;
    },
    { immediate: true },
  );

  function resetDefaults() {
    smoothingAlpha.value = DEFAULT_SMOOTHING_ALPHA;
    expressionIntensity.value = DEFAULT_EXPRESSION_INTENSITY;
    moodReactivity.value = DEFAULT_MOOD_REACTIVITY;
    moodDecaySeconds.value = DEFAULT_MOOD_DECAY_SECONDS;
    emotionWeight.value = DEFAULT_EMOTION_WEIGHT;
  }

  return {
    smoothingAlpha,
    expressionIntensity,
    moodReactivity,
    moodDecaySeconds,
    emotionWeight,
    isDark,
    locale,
    resetDefaults,
  };
});
