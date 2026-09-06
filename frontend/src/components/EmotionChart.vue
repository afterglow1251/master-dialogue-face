<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { RadarIcon } from "lucide-vue-next";
import EmptyState from "@/components/EmptyState.vue";
import { Radar } from "vue-chartjs";
import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
  type ChartOptions,
  type TooltipItem,
} from "chart.js";

import { useEmotionStore } from "@/stores/emotion.store";
import { EMOTION_LABELS } from "@shared/types/emotion";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

const { t } = useI18n();
const emotionStore = useEmotionStore();
const { currentProbabilities, currentMood } = storeToRefs(emotionStore);

const chartData = computed(() => {
  const datasets = [
    {
      label: t("emotionRadar.acuteEmotion"),
      data: EMOTION_LABELS.map(
        (label) => currentProbabilities.value?.[label] ?? 0,
      ),
      backgroundColor: "rgba(99, 102, 241, 0.2)",
      borderColor: "rgb(99, 102, 241)",
      borderWidth: 2,
      pointBackgroundColor: "rgb(99, 102, 241)",
      pointRadius: 2,
    },
  ];

  if (currentMood.value) {
    datasets.push({
      label: t("emotionRadar.mood"),
      data: EMOTION_LABELS.map(
        (label) => currentMood.value?.categories[label] ?? 0,
      ),
      backgroundColor: "rgba(245, 158, 11, 0.15)",
      borderColor: "rgb(245, 158, 11)",
      borderWidth: 1.5,
      pointBackgroundColor: "rgb(245, 158, 11)",
      pointRadius: 1.5,
    });
  }

  return {
    labels: EMOTION_LABELS.map((label) => t("emotions." + label)),
    datasets,
  };
});

const chartOptions: ChartOptions<"radar"> = {
  responsive: true,
  maintainAspectRatio: true,
  scales: {
    r: {
      beginAtZero: true,
      max: 1,
      ticks: {
        stepSize: 0.2,
        display: false,
      },
      pointLabels: {
        font: { size: 10 },
      },
    },
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: (context: TooltipItem<"radar">) =>
          `${context.dataset.label ?? ""}: ${(context.parsed.r * 100).toFixed(1)}%`,
      },
    },
    legend: {
      display: true,
      position: "bottom",
      labels: {
        font: { size: 11 },
        usePointStyle: true,
        pointStyle: "circle",
      },
    },
  },
} as const;
</script>

<template>
  <div>
    <Radar
      v-if="currentProbabilities"
      :data="chartData"
      :options="chartOptions"
    />
    <EmptyState v-else :icon="RadarIcon" :message="t('emotionRadar.noData')" />
  </div>
</template>
