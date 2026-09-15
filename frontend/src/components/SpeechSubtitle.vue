<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { LoaderCircle } from "lucide-vue-next";

import { useConversationStore } from "@/stores/conversation.store";

const { t } = useI18n();
const { phase, userText, replyText, errorMessage } = storeToRefs(
  useConversationStore(),
);

const isVisible = computed(
  () => userText.value.length > 0 || errorMessage.value !== null,
);
const isWaiting = computed(
  () => phase.value === "thinking" && replyText.value.length === 0,
);
</script>

<template>
  <div
    v-if="isVisible"
    class="space-y-1.5 rounded-xl border border-border/60 bg-card/90 px-4 py-3 text-card-foreground shadow-lg backdrop-blur-sm"
  >
    <p v-if="userText" class="text-xs text-muted-foreground">
      <span class="font-medium">{{ t("speech.you") }}:</span>
      {{ userText }}
    </p>

    <p v-if="isWaiting" class="flex items-center gap-2 text-sm">
      <LoaderCircle :size="14" class="animate-spin text-muted-foreground" />
      <span class="text-muted-foreground">{{ t("speech.thinking") }}</span>
    </p>

    <p v-else-if="replyText" class="text-sm leading-relaxed">
      <span class="font-medium text-primary">{{ t("speech.avatar") }}:</span>
      {{ replyText }}
    </p>

    <p v-if="errorMessage" class="text-xs text-destructive">
      {{ t("speech.error") }}: {{ errorMessage }}
    </p>
  </div>
</template>
