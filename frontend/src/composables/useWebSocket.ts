import {
  useWebSocket as useVueUseWebSocket,
  watchDebounced,
} from "@vueuse/core";
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAuth } from "@clerk/vue";

import { useEmotionStore } from "@/stores/emotion.store";
import { useDialogueStore } from "@/stores/dialogue.store";
import { useSettingsStore } from "@/stores/settings.store";
import type { WsClientMessage } from "@shared/types/websocket";
import { isWsServerMessage } from "@/types/websocket";
import { env } from "@/utils/env";

export function useAppWebSocket() {
  const emotionStore = useEmotionStore();
  const dialogueStore = useDialogueStore();
  const { getToken } = useAuth();

  const token = ref<string | undefined>();

  async function refreshToken() {
    const t = await getToken.value();
    token.value = t ?? undefined;
  }

  // Get initial token
  refreshToken();

  const wsUrl = computed(() => {
    if (!token.value) return undefined;
    const url = new URL(env.wsUrl);
    url.searchParams.set("token", token.value);
    return url.toString();
  });

  const { status, data, send, open, close } = useVueUseWebSocket(wsUrl, {
    autoReconnect: {
      retries: 10,
      delay: 2000,
      onFailed() {
        // Refresh token on reconnect failure in case it expired
        refreshToken();
      },
    },
    heartbeat: {
      message: JSON.stringify({ type: "ping" }),
      interval: 30_000,
      pongTimeout: 5_000,
    },
  });

  // Refresh token periodically (Clerk tokens are short-lived)
  const TOKEN_REFRESH_INTERVAL_MS = 50_000;
  const refreshInterval = setInterval(refreshToken, TOKEN_REFRESH_INTERVAL_MS);

  watch(data, (raw) => {
    if (!raw) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }

    if (!isWsServerMessage(parsed)) return;

    switch (parsed.type) {
      case "blendshape_update": {
        const isFirstTurn = dialogueStore.turns.length === 0;
        emotionStore.updateFromAnalysis({
          blendshapes: parsed.blendshapes,
          categories: parsed.emotions.categories,
          vad: parsed.emotions.vad,
          topEmotions: parsed.emotions.topEmotions,
          processingTimeMs: parsed.processingTimeMs,
          mood: parsed.mood,
          combinedEmotions: parsed.combinedEmotions,
        });
        dialogueStore.addTurn({
          id: parsed.turnId,
          text: parsed.text,
          turnIndex: dialogueStore.turns.length,
          createdAt: new Date().toISOString(),
          emotions: parsed.emotions,
          mood: parsed.mood,
          combinedEmotions: parsed.combinedEmotions,
          blendshapes: parsed.blendshapes,
          processingTimeMs: parsed.processingTimeMs,
        });
        if (isFirstTurn) {
          const MAX_TITLE_LENGTH = 50;
          const autoTitle =
            parsed.text.length > MAX_TITLE_LENGTH
              ? parsed.text.slice(0, MAX_TITLE_LENGTH) + "…"
              : parsed.text;
          dialogueStore.updateDialogueTitle(
            dialogueStore.currentDialogueId!,
            autoTitle,
          );
        }
        dialogueStore.isLoading = false;
        break;
      }

      case "mood_state":
        emotionStore.updateMood(parsed.mood);
        emotionStore.currentBlendshapes = parsed.blendshapes;
        break;

      case "error":
        console.error(`WebSocket error [${parsed.code}]:`, parsed.message);
        dialogueStore.isLoading = false;
        break;

      case "pong":
        break;
    }
  });

  function sendMessage(message: WsClientMessage) {
    send(JSON.stringify(message));
  }

  function analyzeText(text: string) {
    const dialogueId = dialogueStore.currentDialogueId;
    if (!dialogueId) return;

    dialogueStore.isLoading = true;
    sendMessage({
      type: "analyze",
      dialogueId,
      text,
    });
  }

  function resetMood() {
    const dialogueId = dialogueStore.currentDialogueId;
    if (!dialogueId) return;

    sendMessage({
      type: "mood_reset",
      dialogueId,
    });
  }

  // Sync settings to backend when they change
  const settingsStore = useSettingsStore();
  const {
    contextWindowSize,
    expressionIntensity,
    moodReactivity,
    moodDecaySeconds,
    emotionWeight,
  } = storeToRefs(settingsStore);

  watchDebounced(
    [
      contextWindowSize,
      expressionIntensity,
      moodReactivity,
      moodDecaySeconds,
      emotionWeight,
    ],
    () => {
      sendMessage({
        type: "settings_update",
        settings: {
          contextWindowSize: contextWindowSize.value,
          expressionIntensity: expressionIntensity.value,
          moodReactivity: moodReactivity.value,
          moodDecaySeconds: moodDecaySeconds.value,
          emotionWeight: emotionWeight.value,
        },
      });
    },
    { debounce: 300 },
  );

  return {
    status,
    sendMessage,
    analyzeText,
    resetMood,
    open,
    close,
    cleanup() {
      clearInterval(refreshInterval);
    },
  };
}
