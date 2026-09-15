<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { DialogueTurn } from "@/stores/dialogue.store";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TurnDynamics from "@/components/TurnDynamics.vue";
import { formatVAD, formatVADDelta } from "@/utils/moodTimeline";

const props = defineProps<{
  turn: DialogueTurn;
  previousTurn?: DialogueTurn;
  open: boolean;
}>();

const { t } = useI18n();

const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatDelta(current: number, previous: number): string {
  const delta = current - previous;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${(delta * 100).toFixed(1)}%`;
}

const topEmotions = computed(() => {
  if (!props.turn.emotions) return [];
  return [...props.turn.emotions.topEmotions].slice(0, 5);
});

const moodTopEmotions = computed(() => {
  if (!props.turn.mood) return [];
  return [...props.turn.mood.topEmotions].slice(0, 3);
});

const vadDelta = computed(() => {
  if (!props.turn.emotions?.vad || !props.previousTurn?.emotions?.vad) {
    return null;
  }
  const curr = props.turn.emotions.vad;
  const prev = props.previousTurn.emotions.vad;
  return {
    valence: formatVADDelta(curr.valence, prev.valence),
    arousal: formatVADDelta(curr.arousal, prev.arousal),
    dominance: formatVADDelta(curr.dominance, prev.dominance),
  };
});

const moodVadDelta = computed(() => {
  if (!props.turn.mood?.vad || !props.previousTurn?.mood?.vad) return null;
  const curr = props.turn.mood.vad;
  const prev = props.previousTurn.mood.vad;
  return {
    valence: formatVADDelta(curr.valence, prev.valence),
    arousal: formatVADDelta(curr.arousal, prev.arousal),
    dominance: formatVADDelta(curr.dominance, prev.dominance),
  };
});
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-h-[85vh] overflow-y-auto p-6 sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle class="text-base">
          {{ t("emotionReport.title", { turn: turn.turnIndex + 1 }) }}
        </DialogTitle>
        <DialogDescription class="line-clamp-2 text-xs">
          "{{ turn.text }}"
        </DialogDescription>
      </DialogHeader>

      <Tabs default-value="report">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="report">{{
            t("emotionReport.tabReport")
          }}</TabsTrigger>
          <TabsTrigger value="dynamics">{{
            t("emotionReport.tabDynamics")
          }}</TabsTrigger>
        </TabsList>

        <TabsContent value="report" class="space-y-4">
          <!-- Acute emotions -->
          <div class="space-y-3">
            <h4 class="text-sm font-medium">
              {{ t("emotionReport.detectedEmotions") }}
            </h4>
            <div class="space-y-1.5">
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
                <span
                  class="w-12 text-right text-xs tabular-nums text-muted-foreground"
                >
                  {{ formatPercent(emotion.probability) }}
                </span>
              </div>
            </div>

            <!-- VAD -->
            <div
              v-if="turn.emotions?.vad"
              class="flex flex-wrap items-center gap-2"
            >
              <Badge variant="outline" class="text-[10px]">
                V: {{ formatVAD(turn.emotions.vad.valence) }}
                <template v-if="vadDelta">
                  <span class="ml-1 text-muted-foreground">{{
                    vadDelta.valence
                  }}</span>
                </template>
              </Badge>
              <Badge variant="outline" class="text-[10px]">
                A: {{ formatVAD(turn.emotions.vad.arousal) }}
                <template v-if="vadDelta">
                  <span class="ml-1 text-muted-foreground">{{
                    vadDelta.arousal
                  }}</span>
                </template>
              </Badge>
              <Badge variant="outline" class="text-[10px]">
                D: {{ formatVAD(turn.emotions.vad.dominance) }}
                <template v-if="vadDelta">
                  <span class="ml-1 text-muted-foreground">{{
                    vadDelta.dominance
                  }}</span>
                </template>
              </Badge>
              <span
                v-if="turn.processingTimeMs"
                class="ml-auto text-[10px] text-muted-foreground"
              >
                {{ turn.processingTimeMs.toFixed(0) }}ms
              </span>
            </div>
          </div>

          <Separator />

          <!-- Mood state -->
          <div v-if="turn.mood" class="space-y-3">
            <h4 class="text-sm font-medium">
              {{ t("emotionReport.moodState") }}
            </h4>
            <div class="space-y-1.5">
              <div
                v-for="emotion in moodTopEmotions"
                :key="emotion.name"
                class="flex items-center gap-2"
              >
                <span class="w-28 shrink-0 text-xs text-muted-foreground">
                  {{ t("emotions." + emotion.name) }}
                </span>
                <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    class="h-full rounded-full bg-amber-500 transition-all duration-300"
                    :style="{ width: formatPercent(emotion.probability) }"
                  />
                </div>
                <span
                  class="w-12 text-right text-xs tabular-nums text-muted-foreground"
                >
                  {{ formatPercent(emotion.probability) }}
                </span>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" class="text-[10px]">
                V: {{ formatVAD(turn.mood.vad.valence) }}
                <template v-if="moodVadDelta">
                  <span class="ml-1 text-muted-foreground">{{
                    moodVadDelta.valence
                  }}</span>
                </template>
              </Badge>
              <Badge variant="secondary" class="text-[10px]">
                A: {{ formatVAD(turn.mood.vad.arousal) }}
                <template v-if="moodVadDelta">
                  <span class="ml-1 text-muted-foreground">{{
                    moodVadDelta.arousal
                  }}</span>
                </template>
              </Badge>
              <Badge variant="secondary" class="text-[10px]">
                D: {{ formatVAD(turn.mood.vad.dominance) }}
                <template v-if="moodVadDelta">
                  <span class="ml-1 text-muted-foreground">{{
                    moodVadDelta.dominance
                  }}</span>
                </template>
              </Badge>
              <span class="ml-auto text-[10px] text-muted-foreground">
                {{ t("emotionReport.turn", { n: turn.mood.turnsSinceReset }) }}
              </span>
            </div>
          </div>

          <!-- Comparison with previous (or delta from zero for first turn) -->
          <template v-if="topEmotions.length > 0">
            <Separator />
            <div class="space-y-2">
              <h4 class="text-sm font-medium">
                {{
                  previousTurn?.emotions
                    ? t("emotionReport.changeFromPrevious")
                    : t("emotionReport.detectedChange")
                }}
              </h4>
              <div class="columns-2 gap-2 text-xs">
                <div
                  v-for="emotion in topEmotions"
                  :key="`delta-${emotion.name}`"
                  class="mb-1.5 flex items-center gap-1.5 break-inside-avoid"
                >
                  <span class="text-muted-foreground">{{
                    t("emotions." + emotion.name)
                  }}</span>
                  <span
                    class="tabular-nums"
                    :class="{
                      'text-emerald-600':
                        emotion.probability -
                          (previousTurn?.emotions?.categories[emotion.name] ??
                            0) >
                        0.01,
                      'text-red-600':
                        emotion.probability -
                          (previousTurn?.emotions?.categories[emotion.name] ??
                            0) <
                        -0.01,
                      'text-muted-foreground':
                        Math.abs(
                          emotion.probability -
                            (previousTurn?.emotions?.categories[emotion.name] ??
                              0),
                        ) <= 0.01,
                    }"
                  >
                    {{
                      formatDelta(
                        emotion.probability,
                        previousTurn?.emotions?.categories[emotion.name] ?? 0,
                      )
                    }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </TabsContent>

        <TabsContent value="dynamics">
          <TurnDynamics :turn="turn" :previous-turn="previousTurn" />
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>
