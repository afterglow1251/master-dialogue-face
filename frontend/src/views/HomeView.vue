<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import {
  PanelLeft,
  Radar,
  Settings,
  X,
  ArrowLeft,
  SquarePen,
  History,
  LoaderCircle,
  Moon,
  Sun,
} from "lucide-vue-next";
import { UserButton } from "@clerk/vue";

import { useDialogueStore } from "@/stores/dialogue.store";
import { useEmotionStore } from "@/stores/emotion.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useAppWebSocket } from "@/composables/useWebSocket";
import { useDialogueCrud } from "@/composables/useDialogueCrud";
import AvatarScene from "@/components/AvatarScene.vue";
import DialogueInput from "@/components/DialogueInput.vue";
import DialogueHistory from "@/components/DialogueHistory.vue";
import EmotionPanel from "@/components/EmotionPanel.vue";
import EmotionChart from "@/components/EmotionChart.vue";
import SettingsPanel from "@/components/SettingsPanel.vue";
import ChatSidebar from "@/components/ChatSidebar.vue";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const AVATAR_MODEL_URL = "/models/avatar-WCpLm2TimIAYnTVYq3uS.glb";
const floatingSurfaceClass =
  "border border-border/60 bg-background/80 shadow-sm backdrop-blur-sm";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const dialogueStore = useDialogueStore();
const { isLoading } = storeToRefs(dialogueStore);
const emotionStore = useEmotionStore();
const { topEmotions } = storeToRefs(emotionStore);
const { currentProbabilities } = storeToRefs(emotionStore);
const { isDark, locale } = storeToRefs(useSettingsStore());
const { analyzeText, resetMood } = useAppWebSocket();
const {
  createNewChat,
  selectChat,
  renameChat,
  deleteChat: deleteChatRaw,
} = useDialogueCrud();

async function handleDeleteChat(dialogueId: string) {
  const wasCurrentChat = dialogueStore.currentDialogueId === dialogueId;
  await deleteChatRaw(dialogueId);
  if (wasCurrentChat) {
    emotionStore.reset();
    void router.replace({ name: "chat" });
  }
}

type SidebarPanel = "main" | "tuning" | "history";
const showSidebar = ref(false);
const sidebarPanel = ref<SidebarPanel>("main");
const showRadar = ref(false);
const isCreatingChat = ref(false);

// Reset panel to main when sidebar closes
watch(showSidebar, (open) => {
  if (!open) sidebarPanel.value = "main";
});

// Load chat from URL param
watch(
  () => route.params.chatId,
  async (chatId) => {
    if (
      typeof chatId === "string" &&
      chatId !== dialogueStore.currentDialogueId
    ) {
      const found = await selectChat(chatId);
      if (!found) {
        void router.replace({ name: "chat" });
        return;
      }
    }
    if (!chatId && dialogueStore.currentDialogueId) {
      dialogueStore.currentDialogueId = null;
      dialogueStore.turns = [];
    }
  },
  { immediate: true },
);

async function handleSubmit(text: string) {
  if (!dialogueStore.currentDialogueId) {
    const id = await createNewChat();
    if (id) {
      void router.replace({ name: "chat-detail", params: { chatId: id } });
    }
  }
  analyzeText(text);
}

async function handleNewChat() {
  isCreatingChat.value = true;
  const id = await createNewChat();
  isCreatingChat.value = false;
  if (id) {
    void router.push({ name: "chat-detail", params: { chatId: id } });
  }
}

async function handleSelectChat(dialogueId: string) {
  showSidebar.value = false;
  void router.push({ name: "chat-detail", params: { chatId: dialogueId } });
}
</script>

<template>
  <div class="relative h-screen w-screen overflow-hidden bg-background">
    <!-- Avatar: full screen background -->
    <div class="absolute inset-0">
      <AvatarScene :model-url="AVATAR_MODEL_URL" />
    </div>

    <!-- Top bar -->
    <header
      class="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-3"
    >
      <div class="flex items-center gap-2">
        <Button variant="toolbar" size="icon" @click="showSidebar = true">
          <PanelLeft :size="18" />
        </Button>
      </div>
      <div />
    </header>

    <!-- Compact emotion badges: floating top-left under header -->
    <div
      v-if="topEmotions.length > 0"
      class="absolute left-4 top-16 z-10 flex flex-col gap-1.5"
    >
      <div
        v-for="emotion in topEmotions.slice(0, 3)"
        :key="emotion.name"
        :class="[
          floatingSurfaceClass,
          'flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs',
        ]"
      >
        <span>{{ t("emotions." + emotion.name) }}</span>
        <span class="font-medium text-primary">
          {{ (emotion.probability * 100).toFixed(1) }}%
        </span>
      </div>
    </div>

    <!-- Bottom: Chat area overlay -->
    <div
      class="absolute bottom-0 left-1/2 z-10 w-full max-w-2xl -translate-x-1/2 space-y-2 p-4"
    >
      <EmotionPanel />

      <DialogueInput :disabled="isLoading" @submit="handleSubmit" />
    </div>

    <!-- Workspace Sidebar -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-100"
        leave-active-class="transition-opacity duration-75"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showSidebar"
          class="fixed inset-0 z-50 bg-black/38"
          @click="showSidebar = false"
        />
      </Transition>

      <Transition
        enter-active-class="transition-transform duration-100 ease-out"
        leave-active-class="transition-transform duration-75 ease-in"
        enter-from-class="-translate-x-full"
        leave-to-class="-translate-x-full"
      >
        <div
          v-if="showSidebar"
          class="fixed inset-y-0 left-0 z-50 flex w-[22rem] flex-col border-r bg-background px-6 pb-4 pt-4 shadow-lg"
        >
          <!-- Top row: back button (or spacer) + close -->
          <div class="mb-4 flex items-center justify-between">
            <button
              v-if="sidebarPanel !== 'main'"
              class="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              @click="sidebarPanel = 'main'"
            >
              <ArrowLeft :size="14" />
              {{ t("workspace.title") }}
            </button>
            <span v-else />
            <button
              class="ring-offset-background focus:ring-ring rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
              @click="showSidebar = false"
            >
              <X class="size-4" />
              <span class="sr-only">{{ t("common.close") }}</span>
            </button>
          </div>

          <!-- Panel: Main -->
          <template v-if="sidebarPanel === 'main'">
            <div class="mb-5">
              <h2 class="text-lg font-semibold tracking-tight">
                {{ t("workspace.title") }}
              </h2>
              <p class="text-sm text-muted-foreground">
                {{ t("workspace.description") }}
              </p>
            </div>

            <div class="mb-3 space-y-0.5">
              <button
                class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                :disabled="isCreatingChat"
                @click="handleNewChat"
              >
                <LoaderCircle
                  v-if="isCreatingChat"
                  :size="16"
                  class="animate-spin"
                />
                <SquarePen v-else :size="16" />
                {{ t("sidebar.newChat") }}
              </button>
              <button
                class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
                @click="sidebarPanel = 'history'"
              >
                <History :size="16" />
                {{ t("sidebar.history") }}
              </button>
              <button
                class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
                @click="showRadar = true"
              >
                <Radar :size="16" />
                {{ t("sidebar.radar") }}
              </button>
              <button
                class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
                @click="sidebarPanel = 'tuning'"
              >
                <Settings :size="16" />
                {{ t("sidebar.tuning") }}
              </button>
            </div>

            <div class="flex min-h-0 flex-1 flex-col">
              <ChatSidebar
                class="flex-1"
                @new-chat="handleNewChat"
                @select-chat="handleSelectChat"
                @rename-chat="renameChat"
                @delete-chat="handleDeleteChat"
              />

              <div
                class="mt-3 flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 px-3 py-3"
              >
                <div>
                  <p class="text-sm font-medium text-foreground">
                    {{ t("sidebar.account") }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ t("sidebar.accountDescription") }}
                  </p>
                </div>

                <UserButton>
                  <UserButton.UserProfilePage
                    :label="t('preferences.title')"
                    url="preferences"
                  >
                    <template #labelIcon>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="size-4"
                      >
                        <path
                          d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
                        />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </template>
                    <div class="space-y-4 px-6 pb-6">
                      <h1 class="text-[0.9375rem] font-semibold">
                        {{ t("preferences.title") }}
                      </h1>

                      <div
                        class="flex items-center justify-between border-b border-gray-200 py-3"
                      >
                        <div>
                          <p class="text-[0.8125rem] font-medium">
                            {{ t("preferences.language") }}
                          </p>
                          <p class="text-xs text-gray-500">
                            {{ t("preferences.languageName") }}
                          </p>
                        </div>
                        <button
                          class="h-8 rounded-md border border-gray-200 px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
                          @click="locale = locale === 'uk' ? 'en' : 'uk'"
                        >
                          {{ locale === "uk" ? "EN" : "UA" }}
                        </button>
                      </div>

                      <div class="flex items-center justify-between py-3">
                        <div>
                          <p class="text-[0.8125rem] font-medium">
                            {{
                              isDark
                                ? t("sidebar.darkMode")
                                : t("sidebar.lightMode")
                            }}
                          </p>
                          <p class="text-xs text-gray-500">
                            {{ t("preferences.colorScheme") }}
                          </p>
                        </div>
                        <button
                          class="flex size-8 items-center justify-center rounded-md border border-gray-200 text-gray-700 transition-colors hover:bg-gray-100"
                          @click="isDark = !isDark"
                        >
                          <Sun v-if="isDark" :size="14" />
                          <Moon v-else :size="14" />
                        </button>
                      </div>
                    </div>
                  </UserButton.UserProfilePage>
                </UserButton>
              </div>
            </div>
          </template>

          <!-- Panel: Tuning -->
          <template v-else-if="sidebarPanel === 'tuning'">
            <h2 class="text-lg font-semibold tracking-tight">
              {{ t("tuning.title") }}
            </h2>
            <p class="mb-4 text-sm text-muted-foreground">
              {{ t("tuning.description") }}
            </p>
            <div class="flex-1 overflow-y-auto">
              <SettingsPanel @reset-mood="resetMood" />
            </div>
          </template>

          <!-- Panel: History -->
          <template v-else-if="sidebarPanel === 'history'">
            <h2 class="text-lg font-semibold tracking-tight">
              {{ t("history.title") }}
            </h2>
            <p class="mb-4 text-sm text-muted-foreground">
              {{ t("history.description") }}
            </p>
            <div class="flex-1 overflow-y-auto">
              <DialogueHistory />
            </div>
          </template>
        </div>
      </Transition>
    </Teleport>

    <!-- Emotion Radar Dialog -->
    <Dialog v-model:open="showRadar">
      <DialogContent
        :class="['p-6', currentProbabilities ? 'sm:max-w-3xl' : 'sm:max-w-md']"
        @close-auto-focus.prevent
      >
        <DialogHeader :class="currentProbabilities ? 'mb-4' : 'mb-0'">
          <DialogTitle class="text-lg">{{
            t("emotionRadar.title")
          }}</DialogTitle>
          <DialogDescription>
            {{ t("emotionRadar.description") }}
          </DialogDescription>
        </DialogHeader>
        <EmotionChart />
      </DialogContent>
    </Dialog>
  </div>
</template>
