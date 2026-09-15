<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { Check, Pencil, X } from "lucide-vue-next";

import { Skeleton } from "@/components/ui/skeleton";

const MAX_TITLE_LENGTH = 200;

const props = defineProps<{
  title: string | null;
  editable: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  rename: [title: string];
}>();

const { t } = useI18n();
const input = useTemplateRef<HTMLInputElement>("input");
const isEditing = ref(false);
const draft = ref("");

async function startEditing() {
  draft.value = props.title ?? "";
  isEditing.value = true;
  await nextTick();
  input.value?.focus();
  input.value?.select();
}

function save() {
  if (!isEditing.value) return;
  isEditing.value = false;
  const title = draft.value.trim();
  if (title.length > 0 && title !== props.title) emit("rename", title);
}

function cancel() {
  isEditing.value = false;
}
</script>

<template>
  <form
    v-if="isEditing"
    class="flex min-w-0 flex-1 items-center gap-1"
    @submit.prevent="save"
  >
    <input
      ref="input"
      v-model="draft"
      :maxlength="MAX_TITLE_LENGTH"
      :aria-label="t('chat.rename')"
      class="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      @keydown.esc.prevent="cancel"
      @blur="save"
    />
    <button
      type="submit"
      class="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
      :title="t('chat.rename')"
      @mousedown.prevent
    >
      <Check :size="14" />
    </button>
    <button
      type="button"
      class="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
      :title="t('common.close')"
      @mousedown.prevent
      @click="cancel"
    >
      <X :size="14" />
    </button>
  </form>

  <Skeleton v-else-if="loading" class="h-4 w-40" />

  <div v-else class="group flex min-w-0 flex-1 items-center gap-1">
    <h1 class="truncate text-sm font-medium">
      {{ title ?? t("chat.newChat") }}
    </h1>
    <button
      v-if="editable"
      type="button"
      class="shrink-0 rounded p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
      :title="t('chat.rename')"
      @click="startEditing"
    >
      <Pencil :size="14" />
    </button>
  </div>
</template>
