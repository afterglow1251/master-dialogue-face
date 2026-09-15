<script setup lang="ts">
import { storeToRefs } from "pinia";

import type { SpeechLanguage } from "@shared/types/speech";
import ChatMessageList from "@/components/ChatMessageList.vue";
import ChatTitle from "@/components/ChatTitle.vue";
import ConversationDynamics from "@/components/ConversationDynamics.vue";
import DialogueInput from "@/components/DialogueInput.vue";
import { useDialogueStore } from "@/stores/dialogue.store";

defineProps<{
  busy: boolean;
  language: SpeechLanguage;
}>();

const emit = defineEmits<{
  submit: [text: string];
  stop: [];
  rename: [title: string];
}>();

const { currentTitle, currentDialogueId, isLoadingList, isLoadingTurns } =
  storeToRefs(useDialogueStore());
</script>

<template>
  <aside class="flex min-h-0 flex-col bg-background">
    <header class="flex h-14 shrink-0 items-center gap-2 px-4">
      <ChatTitle
        class="min-w-0 flex-1"
        :title="currentTitle"
        :editable="currentDialogueId !== null"
        :loading="isLoadingList || isLoadingTurns"
        @rename="emit('rename', $event)"
      />
      <ConversationDynamics />
    </header>

    <div class="min-h-0 flex-1">
      <ChatMessageList />
    </div>

    <footer class="shrink-0 p-3">
      <DialogueInput
        :busy="busy"
        :language="language"
        @submit="emit('submit', $event)"
        @stop="emit('stop')"
      />
    </footer>
  </aside>
</template>
