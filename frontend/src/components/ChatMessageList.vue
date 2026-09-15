<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { MessageSquareDashed } from "lucide-vue-next";

import ChatMessage from "@/components/ChatMessage.vue";
import EmptyState from "@/components/EmptyState.vue";
import LoadingState from "@/components/LoadingState.vue";
import TurnEmotionReport from "@/components/TurnEmotionReport.vue";
import { useConversationStore } from "@/stores/conversation.store";
import { useDialogueStore, type DialogueTurn } from "@/stores/dialogue.store";
import { getMoodTrend } from "@/utils/moodTrend";

const { t } = useI18n();
const { turns, isLoadingTurns } = storeToRefs(useDialogueStore());
const {
  isBusy,
  phase,
  userText,
  replyText,
  errorMessage,
  awaitingUserTurn,
  assistantTurnId,
} = storeToRefs(useConversationStore());

const container = useTemplateRef<HTMLDivElement>("container");
const selectedTurn = ref<DialogueTurn | null>(null);
const reportOpen = ref(false);

const rows = computed(() =>
  turns.value
    .map((turn, index) => {
      const previous = turns.value[index - 1];
      return {
        turn,
        previous,
        emotionName: turn.emotions?.topEmotions[0]?.name ?? null,
        moodTrend:
          turn.role === "user" ? getMoodTrend(turn.mood, previous?.mood) : null,
      };
    })
    .filter(({ turn }) => !(isBusy.value && turn.id === assistantTurnId.value)),
);

const showPendingUser = computed(
  () => awaitingUserTurn.value && userText.value.length > 0,
);
const isEmpty = computed(
  () => rows.value.length === 0 && !showPendingUser.value && !isBusy.value,
);

function openReport(turn: DialogueTurn) {
  selectedTurn.value = turn;
  reportOpen.value = true;
}

function previousTurnOf(turn: DialogueTurn): DialogueTurn | undefined {
  return rows.value.find((row) => row.turn.id === turn.id)?.previous;
}

watch(
  [() => rows.value.length, replyText, showPendingUser, phase, errorMessage],
  async () => {
    await nextTick();
    container.value?.scrollTo({
      top: container.value.scrollHeight,
      behavior: "smooth",
    });
  },
);
</script>

<template>
  <div ref="container" class="h-full overflow-y-auto px-4 py-6">
    <LoadingState v-if="isLoadingTurns" :label="t('common.loading')" />

    <EmptyState
      v-else-if="isEmpty"
      :icon="MessageSquareDashed"
      :message="t('history.empty')"
    />

    <div v-else class="space-y-5">
      <ChatMessage
        v-for="row in rows"
        :key="row.turn.id"
        :role="row.turn.role"
        :text="row.turn.text"
        :emotion-name="row.emotionName"
        :mood-trend="row.moodTrend"
        :has-details="row.turn.emotions !== undefined"
        @details="openReport(row.turn)"
      />

      <ChatMessage
        v-if="showPendingUser"
        role="user"
        :text="userText"
        pending
      />

      <ChatMessage v-if="isBusy" role="assistant" :text="replyText">
        <span
          v-if="replyText.length === 0"
          class="flex items-center gap-1 py-1"
          :aria-label="t('speech.thinking')"
        >
          <span class="size-1.5 animate-bounce rounded-full bg-current" />
          <span
            class="size-1.5 animate-bounce rounded-full bg-current [animation-delay:150ms]"
          />
          <span
            class="size-1.5 animate-bounce rounded-full bg-current [animation-delay:300ms]"
          />
        </span>
      </ChatMessage>

      <p v-if="errorMessage" class="px-1 text-xs text-destructive">
        {{ t("speech.error") }}: {{ errorMessage }}
      </p>
    </div>

    <TurnEmotionReport
      v-if="selectedTurn"
      :turn="selectedTurn"
      :previous-turn="previousTurnOf(selectedTurn)"
      :open="reportOpen"
      @update:open="reportOpen = $event"
    />
  </div>
</template>
