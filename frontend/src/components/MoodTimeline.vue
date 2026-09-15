<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
  type TooltipItem,
} from "chart.js";

import { NEUTRAL_VAD } from "@shared/types/mood";
import type { DialogueTurn } from "@/stores/dialogue.store";
import {
  AXIS_COLOR,
  GRID_COLOR,
  buildDatasets,
  truncate,
} from "@/utils/moodTimeline";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

const props = defineProps<{
  turns: readonly DialogueTurn[];
  highlightIndex?: number;
  class?: string;
}>();

const { t } = useI18n();

const MOOD_DATASET_INDEX = 1;

const chartData = computed<ChartData<"line", (number | null)[], string>>(
  () => ({
    labels: props.turns.map((_, index) => String(index + 1)),
    datasets: buildDatasets(
      props.turns.map((turn) => turn.mood?.vad.valence ?? null),
      props.turns.map((turn) => turn.emotions?.vad.valence ?? null),
      NEUTRAL_VAD.valence,
      {
        mood: t("moodTimeline.mood"),
        positiveEmotion: t("moodTimeline.positiveEmotion"),
        neutralEmotion: t("moodTimeline.neutralEmotion"),
        negativeEmotion: t("moodTimeline.negativeEmotion"),
        neutral: t("moodTimeline.neutral"),
      },
      props.highlightIndex,
    ),
  }),
);

function tooltipTitle(items: readonly TooltipItem<"line">[]): string[] {
  const first = items[0];
  const turn = first ? props.turns[first.dataIndex] : undefined;
  if (!first || !turn) return [];
  const role = t(turn.role === "user" ? "speech.you" : "speech.avatar");
  return [`#${first.dataIndex + 1} · ${role}`, truncate(turn.text)];
}

function tooltipLabel(item: TooltipItem<"line">): string[] {
  const turn = props.turns[item.dataIndex];
  if (!turn) return [];
  const lines: string[] = [];
  const mood = turn.mood?.vad.valence;
  if (mood !== undefined) {
    lines.push(`${t("moodTimeline.mood")}: ${mood.toFixed(2)}`);
  }
  const top = turn.emotions?.topEmotions[0];
  if (top) {
    lines.push(
      `${t("moodTimeline.turnEmotion")}: ${t("emotions." + top.name)}`,
    );
  }
  return lines;
}

const chartOptions = computed<ChartOptions<"line">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  scales: {
    x: {
      title: { display: true, text: t("moodTimeline.turnAxis") },
      grid: { color: GRID_COLOR },
      border: { color: GRID_COLOR },
      ticks: { color: AXIS_COLOR, font: { size: 10 } },
    },
    y: {
      min: 0,
      max: 1,
      title: { display: true, text: t("moodTimeline.valenceAxis") },
      grid: { color: GRID_COLOR },
      border: { color: GRID_COLOR },
      ticks: { color: AXIS_COLOR, stepSize: 0.25, font: { size: 10 } },
    },
  },
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        usePointStyle: true,
        color: AXIS_COLOR,
        boxWidth: 8,
        padding: 16,
        font: { size: 11 },
      },
    },
    tooltip: {
      filter: (item: TooltipItem<"line">) =>
        item.datasetIndex === MOOD_DATASET_INDEX,
      callbacks: { title: tooltipTitle, label: tooltipLabel },
    },
  },
}));
</script>

<template>
  <div :class="['w-full', props.class ?? 'h-72']">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
