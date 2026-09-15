import { defineStore } from "pinia";
import { computed, ref } from "vue";

import type { TurnRole } from "@shared/types/speech";
import type { WsSpeechChunk } from "@shared/types/websocket";
import { SpeechPlayer } from "@/lib/speechPlayer";
import { useEmotionStore } from "@/stores/emotion.store";
import type { MouthShape } from "@/utils/visemes";

export type ConversationPhase = "idle" | "thinking" | "speaking";

export const useConversationStore = defineStore("conversation", () => {
  const emotionStore = useEmotionStore();

  const activeRequestId = ref<string | null>(null);
  const phase = ref<ConversationPhase>("idle");
  const userText = ref("");
  const replyText = ref("");
  const errorMessage = ref<string | null>(null);
  const awaitingUserTurn = ref(false);
  const assistantTurnId = ref<string | null>(null);
  let replyEnded = false;

  const isBusy = computed(() => phase.value !== "idle");

  const player = new SpeechPlayer({
    onChunkStart(chunk) {
      phase.value = "speaking";
      emotionStore.updateFromSpeech({
        blendshapes: chunk.blendshapes,
        categories: chunk.emotions.categories,
        vad: chunk.emotions.vad,
        topEmotions: chunk.emotions.topEmotions,
      });
    },
    onSpokenText(text) {
      replyText.value = text;
    },
    onQueueDrained() {
      if (replyEnded) finish();
      else if (activeRequestId.value) phase.value = "thinking";
    },
  });

  function finish() {
    activeRequestId.value = null;
    phase.value = "idle";
  }

  function startRequest(requestId: string, text: string) {
    player.reset();
    activeRequestId.value = requestId;
    userText.value = text;
    replyText.value = "";
    errorMessage.value = null;
    awaitingUserTurn.value = true;
    assistantTurnId.value = null;
    replyEnded = false;
    phase.value = "thinking";
  }

  function isActive(requestId: string): boolean {
    return activeRequestId.value === requestId;
  }

  function markTurnSaved(requestId: string, role: TurnRole, turnId: string) {
    if (!isActive(requestId)) return;
    if (role === "user") awaitingUserTurn.value = false;
    else assistantTurnId.value = turnId;
  }

  function receiveChunk(chunk: WsSpeechChunk) {
    if (!isActive(chunk.requestId)) return;
    player.enqueue(chunk);
  }

  function endReply(requestId: string) {
    if (!isActive(requestId)) return;
    replyEnded = true;
    if (!player.isBusy) finish();
  }

  function cancel() {
    player.reset();
    awaitingUserTurn.value = false;
    finish();
  }

  function fail(message: string) {
    cancel();
    errorMessage.value = message;
  }

  function clear() {
    cancel();
    userText.value = "";
    replyText.value = "";
    errorMessage.value = null;
  }

  function currentMouthShape(): MouthShape | null {
    return player.currentMouthShape();
  }

  return {
    activeRequestId,
    phase,
    userText,
    replyText,
    errorMessage,
    awaitingUserTurn,
    assistantTurnId,
    isBusy,
    startRequest,
    markTurnSaved,
    receiveChunk,
    endReply,
    cancel,
    fail,
    clear,
    currentMouthShape,
  };
});
