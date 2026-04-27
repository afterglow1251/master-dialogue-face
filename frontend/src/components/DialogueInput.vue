<script setup lang="ts">
import { nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useTextareaAutosize } from "@vueuse/core";
import { ArrowUp } from "lucide-vue-next";

import { Button } from "@/components/ui/button";

const emit = defineEmits<{
  submit: [text: string];
}>();

const props = defineProps<{
  disabled?: boolean;
}>();

const { t } = useI18n();
const { textarea, input: text, triggerResize } = useTextareaAutosize();

async function handleSubmit() {
  const trimmed = text.value.trim();
  if (!trimmed) return;

  emit("submit", trimmed);
  text.value = "";
  await nextTick();
  triggerResize();
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    void handleSubmit();
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div
      class="flex min-w-0 items-center gap-2 rounded-[1.6rem] border border-border bg-background px-4 py-2.5 text-foreground shadow-inner"
    >
      <textarea
        ref="textarea"
        v-model="text"
        :placeholder="t('input.placeholder')"
        :disabled="props.disabled"
        rows="1"
        class="max-h-40 min-h-6 w-full flex-1 resize-none border-0 bg-transparent px-0 py-0 text-base leading-6 text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-base"
        @keydown="handleKeydown"
        @input="triggerResize"
      />

      <Button
        type="submit"
        :disabled="props.disabled || !text.trim()"
        size="icon"
        class="h-8 w-8 shrink-0 rounded-[999px] bg-primary text-primary-foreground shadow-none hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
      >
        <ArrowUp :size="14" />
      </Button>
    </div>
  </form>
</template>
