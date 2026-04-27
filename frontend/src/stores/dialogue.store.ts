import { defineStore } from "pinia";
import { computed, ref } from "vue";

import type {
  EmotionProbabilities,
  EmotionScore,
  VADValues,
} from "@shared/types/emotion";
import type { BlendshapeVector } from "@shared/types/blendshape";
import type { CombinedEmotionalState, MoodState } from "@shared/types/mood";

export interface DialogueTurn {
  readonly id: string;
  readonly text: string;
  readonly turnIndex: number;
  readonly createdAt: string;
  readonly emotions?: {
    readonly categories: EmotionProbabilities;
    readonly vad: VADValues;
    readonly topEmotions: readonly EmotionScore[];
  };
  readonly mood?: MoodState;
  readonly combinedEmotions?: CombinedEmotionalState;
  readonly blendshapes?: BlendshapeVector;
  readonly processingTimeMs?: number;
}

export interface DialogueSummary {
  readonly id: string;
  readonly title: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export const useDialogueStore = defineStore("dialogue", () => {
  const currentDialogueId = ref<string | null>(null);
  const turns = ref<DialogueTurn[]>([]);
  const isLoading = ref(false);

  const dialogueList = ref<DialogueSummary[]>([]);

  const currentTitle = computed(() => {
    const dialogue = dialogueList.value.find(
      (d) => d.id === currentDialogueId.value,
    );
    return dialogue?.title ?? null;
  });

  function setDialogue(dialogueId: string, existingTurns?: DialogueTurn[]) {
    currentDialogueId.value = dialogueId;
    turns.value = existingTurns ?? [];
  }

  function addTurn(turn: DialogueTurn) {
    turns.value.push(turn);
  }

  function setDialogueList(list: DialogueSummary[]) {
    dialogueList.value = list;
  }

  function addDialogueToList(dialogue: DialogueSummary) {
    dialogueList.value.unshift(dialogue);
  }

  function updateDialogueTitle(dialogueId: string, title: string) {
    const dialogue = dialogueList.value.find((d) => d.id === dialogueId);
    if (dialogue) {
      const index = dialogueList.value.indexOf(dialogue);
      dialogueList.value[index] = { ...dialogue, title };
    }
  }

  function removeDialogueFromList(dialogueId: string) {
    dialogueList.value = dialogueList.value.filter((d) => d.id !== dialogueId);
    if (currentDialogueId.value === dialogueId) {
      currentDialogueId.value = null;
      turns.value = [];
    }
  }

  function reset() {
    currentDialogueId.value = null;
    turns.value = [];
    dialogueList.value = [];
    isLoading.value = false;
  }

  return {
    currentDialogueId,
    turns,
    isLoading,
    dialogueList,
    currentTitle,
    setDialogue,
    addTurn,
    setDialogueList,
    addDialogueToList,
    updateDialogueTitle,
    removeDialogueFromList,
    reset,
  };
});
