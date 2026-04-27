<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useEmotionStore } from "@/stores/emotion.store";
import { Badge } from "@/components/ui/badge";

const { t } = useI18n();
const emotionStore = useEmotionStore();
const { topEmotions, currentVAD, lastProcessingTimeMs, currentMood } =
  storeToRefs(emotionStore);

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatVAD(value: number): string {
  return value.toFixed(3);
}
</script>

<template>
  <div
    v-if="topEmotions.length > 0"
    class="rounded-xl border border-border/60 bg-card/90 p-3 text-card-foreground shadow-lg backdrop-blur-sm"
  >
    <div class="flex items-center justify-between gap-4">
      <!-- Top emotions with progress bars -->
      <div class="flex-1 space-y-1.5">
        <div
          v-for="emotion in topEmotions"
          :key="emotion.name"
          class="flex items-center gap-2"
        >
          <span class="w-28 shrink-0 text-xs text-muted-foreground">
            {{ t("emotions." + emotion.name) }}
          </span>
          <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              class="h-full rounded-full bg-primary transition-all duration-300"
              :style="{ width: formatPercent(emotion.probability) }"
            />
          </div>
          <span class="w-11 text-right text-[10px] text-muted-foreground">
            {{ formatPercent(emotion.probability) }}
          </span>
        </div>
      </div>
    </div>

    <!-- VAD + Processing time -->
    <div class="mt-2 flex items-center gap-2">
      <Badge v-if="currentVAD" variant="outline" class="text-[10px]">
        V: {{ formatVAD(currentVAD.valence) }}
      </Badge>
      <Badge v-if="currentVAD" variant="outline" class="text-[10px]">
        A: {{ formatVAD(currentVAD.arousal) }}
      </Badge>
      <Badge v-if="currentVAD" variant="outline" class="text-[10px]">
        D: {{ formatVAD(currentVAD.dominance) }}
      </Badge>
      <span
        v-if="lastProcessingTimeMs > 0"
        class="ml-auto text-[10px] text-muted-foreground"
      >
        {{ lastProcessingTimeMs.toFixed(0) }}ms
      </span>
    </div>

    <!-- Mood state (compact) -->
    <div
      v-if="currentMood"
      class="mt-2 flex items-center gap-2 border-t border-border pt-2"
    >
      <span class="text-[10px] font-medium text-muted-foreground">{{
        t("emotionPanel.mood")
      }}</span>
      <Badge
        v-for="moodEmo in currentMood.topEmotions.slice(0, 2)"
        :key="moodEmo.name"
        variant="secondary"
        class="text-[10px] capitalize"
      >
        {{ t("emotions." + moodEmo.name) }}
        {{ formatPercent(moodEmo.probability) }}
      </Badge>
      <Badge variant="secondary" class="text-[10px]">
        V: {{ formatVAD(currentMood.vad.valence) }}
      </Badge>
      <span class="ml-auto text-[10px] text-muted-foreground">
        #{{ currentMood.turnsSinceReset }}
      </span>
    </div>
  </div>
</template>
