<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/stores/settings.store";
import {
  DEFAULT_EXPRESSION_INTENSITY,
  DEFAULT_SMOOTHING_ALPHA,
  DEFAULT_MOOD_REACTIVITY,
  DEFAULT_MOOD_DECAY_SECONDS,
  DEFAULT_EMOTION_WEIGHT,
  SMOOTHING_ALPHA_MIN,
  SMOOTHING_ALPHA_MAX,
  SMOOTHING_ALPHA_STEP,
  EXPRESSION_INTENSITY_MIN,
  EXPRESSION_INTENSITY_MAX,
  EXPRESSION_INTENSITY_STEP,
  MOOD_REACTIVITY_MIN,
  MOOD_REACTIVITY_MAX,
  MOOD_REACTIVITY_STEP,
  MOOD_DECAY_SECONDS_MIN,
  MOOD_DECAY_SECONDS_MAX,
  MOOD_DECAY_SECONDS_STEP,
  EMOTION_WEIGHT_MIN,
  EMOTION_WEIGHT_MAX,
  EMOTION_WEIGHT_STEP,
} from "@/utils/constants";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const emit = defineEmits<{
  resetMood: [];
}>();

const { t } = useI18n();
const settingsStore = useSettingsStore();
const {
  smoothingAlpha,
  expressionIntensity,
  moodReactivity,
  moodDecaySeconds,
  emotionWeight,
} = storeToRefs(settingsStore);

function formatDecayTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${(seconds / 60).toFixed(0)}m`;
}
</script>

<template>
  <div class="space-y-6">
    <p
      class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
    >
      {{ t("tuning.animation") }}
    </p>

    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium">{{ t("tuning.smoothing") }}</label>
        <span class="text-sm tabular-nums text-muted-foreground">
          {{ smoothingAlpha.toFixed(2) }}
        </span>
      </div>
      <Slider
        :model-value="[smoothingAlpha]"
        :min="SMOOTHING_ALPHA_MIN"
        :max="SMOOTHING_ALPHA_MAX"
        :step="SMOOTHING_ALPHA_STEP"
        @update:model-value="
          (v?: number[]) => (smoothingAlpha = v?.[0] ?? DEFAULT_SMOOTHING_ALPHA)
        "
      />
    </div>

    <Separator />

    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium">{{ t("tuning.intensity") }}</label>
        <span class="text-sm tabular-nums text-muted-foreground">
          {{ expressionIntensity.toFixed(2) }}
        </span>
      </div>
      <Slider
        :model-value="[expressionIntensity]"
        :min="EXPRESSION_INTENSITY_MIN"
        :max="EXPRESSION_INTENSITY_MAX"
        :step="EXPRESSION_INTENSITY_STEP"
        @update:model-value="
          (v?: number[]) =>
            (expressionIntensity = v?.[0] ?? DEFAULT_EXPRESSION_INTENSITY)
        "
      />
    </div>

    <Separator />

    <p
      class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
    >
      {{ t("tuning.moodModel") }}
    </p>

    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium">{{ t("tuning.reactivity") }}</label>
        <span class="text-sm tabular-nums text-muted-foreground">
          {{ moodReactivity.toFixed(2) }}
        </span>
      </div>
      <Slider
        :model-value="[moodReactivity]"
        :min="MOOD_REACTIVITY_MIN"
        :max="MOOD_REACTIVITY_MAX"
        :step="MOOD_REACTIVITY_STEP"
        @update:model-value="
          (v?: number[]) => (moodReactivity = v?.[0] ?? DEFAULT_MOOD_REACTIVITY)
        "
      />
      <p class="text-[10px] text-muted-foreground">
        {{ t("tuning.reactivityHelp") }}
      </p>
    </div>

    <Separator />

    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium">{{ t("tuning.decayTime") }}</label>
        <span class="text-sm tabular-nums text-muted-foreground">
          {{ formatDecayTime(moodDecaySeconds) }}
        </span>
      </div>
      <Slider
        :model-value="[moodDecaySeconds]"
        :min="MOOD_DECAY_SECONDS_MIN"
        :max="MOOD_DECAY_SECONDS_MAX"
        :step="MOOD_DECAY_SECONDS_STEP"
        @update:model-value="
          (v?: number[]) =>
            (moodDecaySeconds = v?.[0] ?? DEFAULT_MOOD_DECAY_SECONDS)
        "
      />
      <p class="text-[10px] text-muted-foreground">
        {{ t("tuning.decayTimeHelp") }}
      </p>
    </div>

    <Separator />

    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium">{{
          t("tuning.emotionWeight")
        }}</label>
        <span class="text-sm tabular-nums text-muted-foreground">
          {{ emotionWeight.toFixed(2) }}
        </span>
      </div>
      <Slider
        :model-value="[emotionWeight]"
        :min="EMOTION_WEIGHT_MIN"
        :max="EMOTION_WEIGHT_MAX"
        :step="EMOTION_WEIGHT_STEP"
        @update:model-value="
          (v?: number[]) => (emotionWeight = v?.[0] ?? DEFAULT_EMOTION_WEIGHT)
        "
      />
      <p class="text-[10px] text-muted-foreground">
        {{ t("tuning.emotionWeightHelp") }}
      </p>
    </div>

    <Separator />

    <div class="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        class="flex-1"
        @click="settingsStore.resetDefaults()"
      >
        {{ t("tuning.resetDefaults") }}
      </Button>
      <Button
        variant="outline"
        size="sm"
        class="flex-1"
        @click="$emit('resetMood')"
      >
        {{ t("tuning.resetMood") }}
      </Button>
    </div>
  </div>
</template>
