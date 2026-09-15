import { NEUTRAL_VAD, type MoodState } from "@shared/types/mood";

export type MoodTrend = "up" | "down" | "flat";

export const MOOD_TREND_THRESHOLD = 0.005;

export function getMoodTrend(
  current: MoodState | undefined,
  previous: MoodState | undefined,
): MoodTrend | null {
  if (!current) return null;

  const before = previous?.vad.valence ?? NEUTRAL_VAD.valence;
  const delta = current.vad.valence - before;

  if (delta > MOOD_TREND_THRESHOLD) return "up";
  if (delta < -MOOD_TREND_THRESHOLD) return "down";
  return "flat";
}
