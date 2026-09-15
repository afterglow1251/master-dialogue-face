import { computed, ref, watch, type MaybeRefOrGetter } from "vue";
import { useSpeechRecognition } from "@vueuse/core";

function joinPhrases(committed: string, phrase: string): string {
  const trimmed = phrase.trim();
  if (trimmed.length === 0) return committed;
  if (committed.trim().length === 0) return trimmed;
  return `${committed.trimEnd()} ${trimmed}`;
}

export function useDictation(lang: MaybeRefOrGetter<string>) {
  const recognition = useSpeechRecognition({
    lang,
    continuous: true,
    interimResults: true,
  });

  const committed = ref("");

  const transcript = computed(() =>
    recognition.isFinal.value
      ? committed.value
      : joinPhrases(committed.value, recognition.result.value),
  );

  watch([recognition.result, recognition.isFinal], ([phrase, isFinal]) => {
    if (isFinal) committed.value = joinPhrases(committed.value, phrase);
  });

  function start(initialText: string) {
    committed.value = initialText;
    recognition.result.value = "";
    recognition.start();
  }

  return {
    isSupported: recognition.isSupported,
    isListening: recognition.isListening,
    error: recognition.error,
    transcript,
    start,
    stop: recognition.stop,
  };
}
