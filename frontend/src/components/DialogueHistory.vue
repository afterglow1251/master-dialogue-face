<script setup lang="ts">
import { ref, nextTick, watch } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { ChartLine, MessageSquareDashed } from "lucide-vue-next";
import EmptyState from "@/components/EmptyState.vue";
import { useDialogueStore, type DialogueTurn } from "@/stores/dialogue.store";
import { ScrollArea } from "@/components/ui/scroll-area";
import TurnEmotionReport from "@/components/TurnEmotionReport.vue";

const { t } = useI18n();
const dialogueStore = useDialogueStore();
const { turns } = storeToRefs(dialogueStore);

const selectedTurn = ref<DialogueTurn | null>(null);
const reportOpen = ref(false);

const scrollRef = ref<InstanceType<typeof ScrollArea> | null>(null);

function getPreviousTurn(turn: DialogueTurn): DialogueTurn | undefined {
  const idx = turns.value.findIndex((t) => t.id === turn.id);
  if (idx <= 0) return undefined;
  return turns.value[idx - 1];
}

function openReport(turn: DialogueTurn) {
  selectedTurn.value = turn;
  reportOpen.value = true;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dominantEmotionLabel(turn: DialogueTurn): string | null {
  const top = turn.emotions?.topEmotions[0];
  return top ? top.name : null;
}

// Auto-scroll to bottom when new turns arrive
watch(
  () => turns.value.length,
  async () => {
    await nextTick();
    const el = scrollRef.value?.$el?.querySelector(
      "[data-reka-scroll-area-viewport]",
    );
    if (el) el.scrollTop = el.scrollHeight;
  },
);
</script>

<template>
  <ScrollArea ref="scrollRef" class="h-full">
    <div class="space-y-2 p-1">
      <div
        v-for="turn in turns"
        :key="turn.id"
        class="group rounded-lg bg-muted/50 px-3 py-2"
      >
        <p class="text-sm">{{ turn.text }}</p>
        <div class="mt-1 flex items-center gap-2">
          <span class="text-xs text-muted-foreground">
            {{ formatTime(turn.createdAt) }}
          </span>
          <span
            v-if="dominantEmotionLabel(turn)"
            class="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary"
          >
            {{ t("emotions." + dominantEmotionLabel(turn)) }}
          </span>
          <button
            v-if="turn.emotions"
            class="ml-auto rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
            :title="t('history.viewReport')"
            @click="openReport(turn)"
          >
            <ChartLine :size="14" />
          </button>
        </div>
      </div>

      <EmptyState
        v-if="turns.length === 0"
        :icon="MessageSquareDashed"
        :message="t('history.empty')"
      />
    </div>
  </ScrollArea>

  <TurnEmotionReport
    v-if="selectedTurn"
    :turn="selectedTurn"
    :previous-turn="getPreviousTurn(selectedTurn)"
    :open="reportOpen"
    @update:open="reportOpen = $event"
  />
</template>
