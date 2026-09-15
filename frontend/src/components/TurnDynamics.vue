<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";

import type { DialogueTurn } from "@/stores/dialogue.store";
import { useDialogueStore } from "@/stores/dialogue.store";
import MoodTimeline from "@/components/MoodTimeline.vue";
import { formatVAD, formatVADDelta } from "@/utils/moodTimeline";

const props = defineProps<{
  turn: DialogueTurn;
  previousTurn?: DialogueTurn;
}>();

const { t } = useI18n();
const { turns } = storeToRefs(useDialogueStore());

const highlightIndex = computed(() => {
  const index = turns.value.findIndex((turn) => turn.id === props.turn.id);
  return index < 0 ? undefined : index;
});

const effectRows = computed(() => {
  const previous = props.previousTurn?.mood?.vad;
  const current = props.turn.mood?.vad;
  if (!previous || !current) return [];
  const axes = [
    { key: "V", from: previous.valence, to: current.valence },
    { key: "A", from: previous.arousal, to: current.arousal },
    { key: "D", from: previous.dominance, to: current.dominance },
  ] as const;
  return axes.map((axis) => ({
    ...axis,
    delta: formatVADDelta(axis.to, axis.from),
    direction: Math.sign(Number((axis.to - axis.from).toFixed(3))),
  }));
});
</script>

<template>
  <div class="space-y-4">
    <MoodTimeline :turns="turns" :highlight-index="highlightIndex" />

    <div v-if="effectRows.length > 0" class="space-y-1.5">
      <h4 class="text-sm font-medium">{{ t("emotionReport.turnEffect") }}</h4>
      <div
        v-for="row in effectRows"
        :key="row.key"
        class="flex items-center gap-2 text-xs tabular-nums"
      >
        <span class="w-4 text-muted-foreground">{{ row.key }}</span>
        <span class="text-muted-foreground">{{ formatVAD(row.from) }}</span>
        <span class="text-muted-foreground">&rarr;</span>
        <span>{{ formatVAD(row.to) }}</span>
        <span
          class="ml-auto"
          :class="{
            'text-emerald-600': row.direction > 0,
            'text-red-600': row.direction < 0,
            'text-muted-foreground': row.direction === 0,
          }"
        >
          {{ row.delta }}
        </span>
      </div>
    </div>
  </div>
</template>
