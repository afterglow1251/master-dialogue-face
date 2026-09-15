export const TURN_ROLES = ["user", "assistant"] as const;

export type TurnRole = (typeof TURN_ROLES)[number];

export const SPEECH_LANGUAGES = ["uk", "en"] as const;

export type SpeechLanguage = (typeof SPEECH_LANGUAGES)[number];

export interface SpeechAlignment {
  readonly characters: readonly string[];
  readonly startTimes: readonly number[];
  readonly endTimes: readonly number[];
}

export function isTurnRole(value: unknown): value is TurnRole {
  return value === "user" || value === "assistant";
}

export function isSpeechLanguage(value: unknown): value is SpeechLanguage {
  return value === "uk" || value === "en";
}
