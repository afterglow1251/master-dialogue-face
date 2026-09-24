<script setup lang="ts">
import { ref, nextTick, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  MessageSquareDashed,
  Pencil,
  LoaderCircle,
  Trash2,
} from "lucide-vue-next";
import EmptyState from "@/components/EmptyState.vue";
import LoadingState from "@/components/LoadingState.vue";
import { storeToRefs } from "pinia";
import { useDialogueStore } from "@/stores/dialogue.store";
import { useEmotionStore } from "@/stores/emotion.store";
import { ScrollArea } from "@/components/ui/scroll-area";

const emit = defineEmits<{
  newChat: [];
  selectChat: [dialogueId: string];
  renameChat: [dialogueId: string, title: string];
  deleteChat: [dialogueId: string];
}>();

const { t, locale } = useI18n();
const dialogueStore = useDialogueStore();
const emotionStore = useEmotionStore();
const { dialogueList, currentDialogueId, isLoadingList } =
  storeToRefs(dialogueStore);

const MS_PER_DAY = 86_400_000;
const RELATIVE_DAYS_LIMIT = 7;

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  // Server clock may be slightly ahead of the client, which would make the
  // difference negative for a just-created chat. Treat that as "now".
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffDays = Math.floor(diffMs / MS_PER_DAY);

  if (diffDays === 0) {
    return date.toLocaleTimeString(locale.value, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) return t("chat.yesterday");
  if (diffDays < RELATIVE_DAYS_LIMIT) return t("chat.daysAgo", diffDays);
  return date.toLocaleDateString(locale.value, {
    month: "short",
    day: "numeric",
  });
}

function handleSelect(dialogueId: string) {
  if (dialogueId === currentDialogueId.value) return;
  emotionStore.reset();
  emit("selectChat", dialogueId);
}

const editingId = ref<string | null>(null);
const deletingIds = ref<Set<string>>(new Set());

function handleDelete(dialogueId: string) {
  deletingIds.value.add(dialogueId);
  emit("deleteChat", dialogueId);
}

watch(dialogueList, () => {
  for (const id of deletingIds.value) {
    if (!dialogueList.value.some((d) => d.id === id)) {
      deletingIds.value.delete(id);
    }
  }
});
const titleRefs = ref<Map<string, HTMLElement>>(new Map());

function setTitleRef(id: string, el: HTMLElement | null) {
  if (el) titleRefs.value.set(id, el);
  else titleRefs.value.delete(id);
}

async function startEditing(dialogueId: string) {
  editingId.value = dialogueId;
  await nextTick();
  const el = titleRefs.value.get(dialogueId);
  if (!el) return;
  el.focus();
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(el);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function handleTitleBlur(
  event: FocusEvent,
  dialogueId: string,
  originalTitle: string | null,
) {
  editingId.value = null;
  const el = event.target as HTMLElement;
  const newTitle = (el.textContent ?? "").trim();
  if (newTitle && newTitle !== (originalTitle ?? "")) {
    emit("renameChat", dialogueId, newTitle);
  } else if (!newTitle) {
    el.textContent = originalTitle ?? t("chat.newChat");
  }
}

function handleTitleKeydown(event: KeyboardEvent) {
  if (event.key === "Enter") {
    event.preventDefault();
    (event.target as HTMLElement).blur();
  }
  if (event.key === "Escape") {
    const el = event.target as HTMLElement;
    // Revert by blurring — handleTitleBlur will restore if empty
    el.blur();
  }
}
</script>

<template>
  <div class="flex h-full flex-col">
    <ScrollArea class="flex-1">
      <div class="space-y-1 pr-2">
        <div
          v-for="dialogue in dialogueList"
          :key="dialogue.id"
          class="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 cursor-pointer"
          :class="{
            'bg-muted': dialogue.id === currentDialogueId,
            'opacity-50 pointer-events-none': deletingIds.has(dialogue.id),
          }"
          @click="handleSelect(dialogue.id)"
        >
          <div class="min-w-0 flex-1">
            <p
              :ref="(el) => setTitleRef(dialogue.id, el as HTMLElement | null)"
              class="truncate font-medium outline-none rounded-sm focus:ring-1 focus:ring-ring focus:px-1 focus:-mx-1"
              :contenteditable="editingId === dialogue.id"
              spellcheck="false"
              @blur="handleTitleBlur($event, dialogue.id, dialogue.title)"
              @keydown="handleTitleKeydown"
            >
              {{ dialogue.title ?? t("chat.newChat") }}
            </p>
            <span class="text-xs text-muted-foreground">
              {{ formatDate(dialogue.createdAt) }}
            </span>
          </div>

          <LoaderCircle
            v-if="deletingIds.has(dialogue.id)"
            :size="14"
            class="ml-2 shrink-0 animate-spin text-muted-foreground"
          />
          <div
            v-else
            class="ml-2 flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <button
              class="rounded p-1 hover:bg-muted"
              :title="t('chat.rename')"
              @click.stop="startEditing(dialogue.id)"
            >
              <Pencil :size="14" />
            </button>
            <button
              class="rounded p-1 hover:bg-destructive/10 hover:text-destructive"
              :title="t('chat.delete')"
              @click.stop="handleDelete(dialogue.id)"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>

        <LoadingState v-if="isLoadingList" :label="t('common.loading')" />

        <EmptyState
          v-else-if="dialogueList.length === 0"
          :icon="MessageSquareDashed"
          :message="t('chat.empty')"
        />
      </div>
    </ScrollArea>
  </div>
</template>
