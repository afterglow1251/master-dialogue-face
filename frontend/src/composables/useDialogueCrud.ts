import { ref, watch } from "vue";
import { useAuth } from "@clerk/vue";

import { useDialogueStore, type DialogueTurn } from "@/stores/dialogue.store";
import { useEmotionStore } from "@/stores/emotion.store";
import { useApi } from "@/lib/api";
import { toTopEmotions } from "@/utils/emotion";

export function useDialogueCrud() {
  const dialogueStore = useDialogueStore();
  const emotionStore = useEmotionStore();
  const api = useApi();
  const { isSignedIn } = useAuth();

  const defaultCharacterId = ref<string | null>(null);
  const isInitialized = ref(false);

  async function loadCharacter() {
    const { data: characters } = await api.api.v1.characters.get();
    if (!characters?.[0]) return;
    defaultCharacterId.value = characters[0].id;
  }

  async function loadDialogueList() {
    const { data } = await api.api.v1.dialogues.get();
    if (!data) return;
    dialogueStore.setDialogueList(
      data.map((d) => ({
        id: d.id,
        title: d.title ?? null,
        createdAt: String(d.createdAt),
        updatedAt: String(d.updatedAt),
      })),
    );
  }

  async function createNewChat(): Promise<string | null> {
    if (!defaultCharacterId.value) return null;

    const { data, error } = await api.api.v1.dialogues.post({
      characterId: defaultCharacterId.value,
    });

    if (error || !data) {
      console.error("Failed to create dialogue:", error);
      return null;
    }

    emotionStore.reset();
    dialogueStore.setDialogue(data.id);
    dialogueStore.addDialogueToList({
      id: data.id,
      title: null,
      createdAt: String(data.createdAt),
      updatedAt: String(data.updatedAt),
    });

    return data.id;
  }

  async function selectChat(dialogueId: string): Promise<boolean> {
    dialogueStore.setDialogue(dialogueId);
    emotionStore.reset();

    const { data } = await api.api.v1.dialogues({ id: dialogueId }).get();
    if (!data) return false;

    const turns: DialogueTurn[] = data.turns.map((t) => ({
      id: t.id,
      role: t.role,
      text: t.text,
      turnIndex: t.turnIndex,
      createdAt: String(t.createdAt),
      emotions:
        t.emotionProbabilities && t.vadValues
          ? {
              categories: t.emotionProbabilities,
              vad: t.vadValues,
              topEmotions: toTopEmotions(t.emotionProbabilities),
            }
          : undefined,
      mood:
        t.moodVadSnapshot && t.combinedProbabilities
          ? {
              vad: t.moodVadSnapshot,
              categories: t.combinedProbabilities,
              topEmotions: toTopEmotions(t.combinedProbabilities, 3),
              turnsSinceReset: 0,
            }
          : undefined,
      processingTimeMs: t.processingTimeMs ?? undefined,
    }));

    dialogueStore.setDialogue(dialogueId, turns);
    return true;
  }

  async function renameChat(dialogueId: string, title: string): Promise<void> {
    const { error } = await api.api.v1.dialogues({ id: dialogueId }).patch({
      title,
    });
    if (!error) {
      dialogueStore.updateDialogueTitle(dialogueId, title);
    }
  }

  async function deleteChat(dialogueId: string): Promise<void> {
    await api.api.v1.dialogues({ id: dialogueId }).delete();
    dialogueStore.removeDialogueFromList(dialogueId);
  }

  // Initialization: load character + dialogues on auth
  watch(
    isSignedIn,
    async (signedIn) => {
      if (!signedIn || defaultCharacterId.value) return;

      try {
        await loadCharacter();
        await loadDialogueList();
        isInitialized.value = true;
      } catch (err) {
        console.error("Failed to initialize:", err);
      }
    },
    { immediate: true },
  );

  return {
    isInitialized,
    createNewChat,
    selectChat,
    renameChat,
    deleteChat,
  };
}
