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
import { useConversationStore } from "@/stores/conversation.store";
import type {
  WsBlendshapeResult,
  WsClientMessage,
} from "@shared/types/websocket";
import { isWsServerMessage } from "@/types/websocket";
import { env } from "@/utils/env";

const MAX_TITLE_LENGTH = 50;

export function useAppWebSocket() {
  const emotionStore = useEmotionStore();
  const dialogueStore = useDialogueStore();
  const conversationStore = useConversationStore();
  const settingsStore = useSettingsStore();
  const { getToken } = useAuth();

  const token = ref<string | undefined>();

  async function refreshToken() {
    const t = await getToken.value();
    token.value = t ?? undefined;
  }

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
        refreshToken();
      },
    },
    onDisconnected() {
      refreshToken();
      conversationStore.cancel();
    },
    heartbeat: {
      message: JSON.stringify({ type: "ping" }),
      interval: 30_000,
      pongTimeout: 5_000,
    },
  });

  function handleTurnSaved(message: WsBlendshapeResult) {
    const isFirstTurn = dialogueStore.turns.length === 0;
    conversationStore.markTurnSaved(
      message.requestId,
      message.role,
      message.turnId,
    );

    dialogueStore.addTurn({
      id: message.turnId,
      role: message.role,
      text: message.text,
      turnIndex: dialogueStore.turns.length,
      createdAt: new Date().toISOString(),
      emotions: message.emotions,
      mood: message.mood,
      combinedEmotions: message.combinedEmotions,
      blendshapes: message.blendshapes,
      processingTimeMs: message.processingTimeMs,
    });

    emotionStore.updateMood(message.mood);

    if (message.role === "user" && conversationStore.phase === "thinking") {
      emotionStore.updateFromAnalysis({
        blendshapes: message.blendshapes,
        categories: message.emotions.categories,
        vad: message.emotions.vad,
        topEmotions: message.emotions.topEmotions,
        processingTimeMs: message.processingTimeMs,
        mood: message.mood,
        combinedEmotions: message.combinedEmotions,
      });
    }

    const dialogueId = dialogueStore.currentDialogueId;
    if (isFirstTurn && message.role === "user" && dialogueId) {
      const autoTitle =
        message.text.length > MAX_TITLE_LENGTH
          ? message.text.slice(0, MAX_TITLE_LENGTH) + "…"
          : message.text;
      dialogueStore.updateDialogueTitle(dialogueId, autoTitle);
    }
  }

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
      case "blendshape_update":
        handleTurnSaved(parsed);
        break;

      case "speech_chunk":
        conversationStore.receiveChunk(parsed);
        break;

      case "reply_end":
        conversationStore.endReply(parsed.requestId);
        break;

      case "mood_state":
        emotionStore.updateMood(parsed.mood);
        emotionStore.currentBlendshapes = parsed.blendshapes;
        break;

      case "error":
        console.error(`WebSocket error [${parsed.code}]:`, parsed.message);
        conversationStore.fail(parsed.message);
        break;

      case "pong":
        break;

      default: {
        const unhandled: never = parsed;
        return unhandled;
      }
    }
  });

  function sendMessage(message: WsClientMessage) {
    send(JSON.stringify(message));
  }

  function sendChat(text: string) {
    const dialogueId = dialogueStore.currentDialogueId;
    if (!dialogueId) return;

    const requestId = crypto.randomUUID();
    conversationStore.startRequest(requestId, text);
    sendMessage({
      type: "chat",
      requestId,
      dialogueId,
      text,
      language: settingsStore.locale,
    });
  }

  function cancelChat() {
    conversationStore.cancel();
    sendMessage({ type: "chat_cancel" });
  }

  function resetMood() {
    const dialogueId = dialogueStore.currentDialogueId;
    if (!dialogueId) return;

    sendMessage({
      type: "mood_reset",
      dialogueId,
    });
  }

  const {
    expressionIntensity,
    expressionMode,
    moodReactivity,
    moodDecaySeconds,
    emotionWeight,
  } = storeToRefs(settingsStore);

  watchDebounced(
    [
      expressionIntensity,
      expressionMode,
      moodReactivity,
      moodDecaySeconds,
      emotionWeight,
    ],
    () => {
      sendMessage({
        type: "settings_update",
        settings: {
          expressionIntensity: expressionIntensity.value,
          expressionMode: expressionMode.value,
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
    sendChat,
    cancelChat,
    resetMood,
    open,
    close,
  };
}
