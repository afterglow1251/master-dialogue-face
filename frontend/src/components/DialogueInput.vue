<script setup lang="ts">
import { computed, nextTick, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useTextareaAutosize } from "@vueuse/core";
import { ArrowUp, Mic, MicOff, Square } from "lucide-vue-next";

import type { SpeechLanguage } from "@shared/types/speech";
import { Button } from "@/components/ui/button";
import { useDictation } from "@/composables/useDictation";

const DICTATION_LANGUAGES = new Map<SpeechLanguage, string>([
  ["uk", "uk-UA"],
  ["en", "en-US"],
]);

const emit = defineEmits<{
  submit: [text: string];
  stop: [];
}>();

const props = defineProps<{
  busy: boolean;
  language: SpeechLanguage;
}>();

const { t } = useI18n();
const textarea = useTemplateRef<HTMLTextAreaElement>("textarea");
const { input: text, triggerResize } = useTextareaAutosize({
  element: textarea,
});

const dictationLang = computed(
  () => DICTATION_LANGUAGES.get(props.language) ?? "en-US",
);
const dictation = useDictation(dictationLang);

watch(dictation.transcript, (value) => {
  if (!dictation.isListening.value) return;
  text.value = value;
  void nextTick(triggerResize);
});

function toggleDictation() {
  if (dictation.isListening.value) {
    dictation.stop();
    return;
  }
  dictation.start(text.value);
}

async function handleSubmit() {
  const trimmed = text.value.trim();
  if (!trimmed || props.busy) return;

  dictation.stop();
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
        :placeholder="
          dictation.isListening.value
            ? t('input.listening')
            : t('input.placeholder')
        "
        rows="1"
        class="max-h-40 min-h-6 w-full flex-1 resize-none border-0 bg-transparent px-0 py-0 text-base leading-6 text-foreground outline-none placeholder:text-muted-foreground md:text-base"
        @keydown="handleKeydown"
        @input="triggerResize"
      />

      <Button
        v-if="dictation.isSupported.value"
        type="button"
        size="icon"
        variant="ghost"
        :title="
          dictation.isListening.value
            ? t('input.stopDictation')
            : t('input.startDictation')
        "
        :class="[
          'h-8 w-8 shrink-0 rounded-[999px]',
          dictation.isListening.value && 'animate-pulse text-destructive',
        ]"
        @click="toggleDictation"
      >
        <MicOff v-if="dictation.isListening.value" :size="16" />
        <Mic v-else :size="16" />
      </Button>

      <Button
        v-if="props.busy"
        type="button"
        size="icon"
        :title="t('input.stopReply')"
        class="h-8 w-8 shrink-0 rounded-[999px] bg-primary text-primary-foreground shadow-none hover:bg-primary/90"
        @click="emit('stop')"
      >
        <Square :size="12" class="fill-current" />
      </Button>

      <Button
        v-else
        type="submit"
        :disabled="!text.trim()"
        size="icon"
        class="h-8 w-8 shrink-0 rounded-[999px] bg-primary text-primary-foreground shadow-none hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
      >
        <ArrowUp :size="14" />
      </Button>
    </div>
  </form>
</template>
