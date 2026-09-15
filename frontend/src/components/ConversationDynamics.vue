<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { ChartSpline } from "lucide-vue-next";

import { useDialogueStore } from "@/stores/dialogue.store";
import MoodTimeline from "@/components/MoodTimeline.vue";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const { t } = useI18n();
const { turns } = storeToRefs(useDialogueStore());

const open = ref(false);

const disabled = computed(() => !turns.value.some((turn) => turn.mood));
</script>

<template>
  <Button
    variant="ghost"
    size="icon"
    :disabled="disabled"
    :aria-label="t('conversationDynamics.title')"
    @click="open = true"
  >
    <ChartSpline :size="18" />
  </Button>

  <Dialog v-model:open="open">
    <DialogContent class="p-6 sm:max-w-4xl" @close-auto-focus.prevent>
      <DialogHeader class="mb-2">
        <DialogTitle class="text-lg">{{
          t("conversationDynamics.title")
        }}</DialogTitle>
        <DialogDescription>
          {{ t("conversationDynamics.description") }}
        </DialogDescription>
      </DialogHeader>
      <MoodTimeline :turns="turns" class="h-[60vh] max-h-[34rem]" />
    </DialogContent>
  </Dialog>
</template>
