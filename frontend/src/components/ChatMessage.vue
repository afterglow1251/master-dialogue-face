<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Info, Minus, TrendingDown, TrendingUp } from "lucide-vue-next";

import type { TurnRole } from "@shared/types/speech";
import type { MoodTrend } from "@/utils/moodTrend";

const props = defineProps<{
  role: TurnRole;
  text: string;
  emotionName?: string | null;
  moodTrend?: MoodTrend | null;
  pending?: boolean;
  hasDetails?: boolean;
}>();

const emit = defineEmits<{
  details: [];
}>();

const { t } = useI18n();

const isUser = computed(() => props.role === "user");

const trendIcon = computed(() => {
  if (props.moodTrend === "up") return TrendingUp;
  if (props.moodTrend === "down") return TrendingDown;
  return Minus;
});

const trendClass = computed(() => {
  if (props.moodTrend === "up") return "text-emerald-600 dark:text-emerald-400";
  if (props.moodTrend === "down") return "text-rose-600 dark:text-rose-400";
  return "text-muted-foreground";
});
</script>

<template>
  <div :class="['flex flex-col gap-1', isUser ? 'items-end' : 'items-start']">
    <div
      :class="[
        'max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
        isUser
          ? 'rounded-br-md bg-primary text-primary-foreground'
          : 'rounded-bl-md bg-muted text-foreground',
        pending && 'opacity-70',
      ]"
    >
      <slot>{{ text }}</slot>
    </div>

    <div
      v-if="emotionName || moodTrend"
      class="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground"
    >
      <span v-if="emotionName">{{ t("emotions." + emotionName) }}</span>
      <span v-if="emotionName && moodTrend" aria-hidden="true">·</span>
      <span
        v-if="moodTrend"
        :class="['flex items-center gap-0.5', trendClass]"
        :title="t('chat.mood.' + moodTrend)"
      >
        {{ t("chat.moodLabel") }}
        <component :is="trendIcon" :size="12" />
      </span>
      <button
        v-if="hasDetails"
        type="button"
        class="rounded p-0.5 transition-colors hover:bg-muted hover:text-foreground"
        :title="t('history.viewReport')"
        @click="emit('details')"
      >
        <Info :size="12" />
      </button>
    </div>
  </div>
</template>
