<script setup lang="ts">
import { computed, watch } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import { useAuth } from "@clerk/vue";
import { LoaderCircle } from "lucide-vue-next";

import { useDialogueStore } from "@/stores/dialogue.store";
import { useEmotionStore } from "@/stores/emotion.store";

const route = useRoute();
const router = useRouter();
const { isLoaded, isSignedIn } = useAuth();

const dialogueStore = useDialogueStore();
const emotionStore = useEmotionStore();

const isAuthRoute = computed(
  () => route.name === "sign-in" || route.name === "sign-up",
);
const isChatRoute = computed(
  () => route.name === "chat" || route.name === "chat-detail",
);
const showLoading = computed(
  () => !isLoaded.value || (!isSignedIn.value && !isAuthRoute.value),
);

watch(
  [isLoaded, isSignedIn],
  ([loaded, signedIn]) => {
    if (!loaded) return;

    if (signedIn && isAuthRoute.value) {
      void router.replace({ name: "chat" });
      return;
    }

    if (signedIn && !isChatRoute.value && !isAuthRoute.value) {
      void router.replace({ name: "chat" });
      return;
    }

    if (!signedIn) {
      dialogueStore.reset();
      emotionStore.reset();

      if (!isAuthRoute.value) {
        void router.replace({ name: "sign-in" });
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <div
    v-if="showLoading"
    class="flex h-screen items-center justify-center bg-background"
  >
    <LoaderCircle class="size-5 animate-spin text-muted-foreground" />
  </div>
  <RouterView v-else />
</template>
