import { eq } from "drizzle-orm";

import { db } from "../db/index.ts";
import { dialogueMoodStates } from "../db/schema.ts";
import {
  NEUTRAL_VAD,
  type CombinedEmotionalState,
  type DialogueId,
  type EmotionProbabilities,
  type MoodState,
  type VADValues,
} from "../types/index.ts";
import {
  categoriesToVAD,
  combineEmotionAndMood,
  effectiveReactivity,
  extractTopEmotions,
  updateMoodVAD,
  vadToEmotionWeights,
} from "@shared/math/index.ts";

// ── Database operations ──

interface MoodStateRow {
  readonly moodValence: number;
  readonly moodArousal: number;
  readonly moodDominance: number;
  readonly turnCount: number;
  readonly lastUpdatedAt: Date;
}

export async function loadMoodState(
  dialogueId: DialogueId,
): Promise<MoodStateRow | null> {
  const [row] = await db
    .select({
      moodValence: dialogueMoodStates.moodValence,
      moodArousal: dialogueMoodStates.moodArousal,
      moodDominance: dialogueMoodStates.moodDominance,
      turnCount: dialogueMoodStates.turnCount,
      lastUpdatedAt: dialogueMoodStates.lastUpdatedAt,
    })
    .from(dialogueMoodStates)
    .where(eq(dialogueMoodStates.dialogueId, dialogueId));

  return row ?? null;
}

export async function saveMoodState(
  dialogueId: DialogueId,
  mood: VADValues,
  turnCount: number,
): Promise<void> {
  await db
    .insert(dialogueMoodStates)
    .values({
      dialogueId,
      moodValence: mood.valence,
      moodArousal: mood.arousal,
      moodDominance: mood.dominance,
      turnCount,
      lastUpdatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: dialogueMoodStates.dialogueId,
      set: {
        moodValence: mood.valence,
        moodArousal: mood.arousal,
        moodDominance: mood.dominance,
        turnCount,
        lastUpdatedAt: new Date(),
      },
    });
}

export async function resetMoodState(
  dialogueId: DialogueId,
): Promise<MoodState> {
  await db
    .delete(dialogueMoodStates)
    .where(eq(dialogueMoodStates.dialogueId, dialogueId));

  const neutralCategories = vadToEmotionWeights(NEUTRAL_VAD);

  return {
    vad: { ...NEUTRAL_VAD },
    categories: neutralCategories,
    topEmotions: extractTopEmotions(neutralCategories),
    turnsSinceReset: 0,
  };
}

// ── Orchestration ──

export interface EmotionalStateResult {
  readonly mood: MoodState;
  readonly combinedEmotions: CombinedEmotionalState;
}

export async function getMoodCategories(
  dialogueId: DialogueId,
): Promise<EmotionProbabilities> {
  const existing = await loadMoodState(dialogueId);
  if (!existing) return vadToEmotionWeights(NEUTRAL_VAD);

  return vadToEmotionWeights({
    valence: existing.moodValence,
    arousal: existing.moodArousal,
    dominance: existing.moodDominance,
  });
}

export async function processEmotionalState(params: {
  readonly dialogueId: DialogueId;
  readonly emotionVAD: VADValues;
  readonly emotionCategories: EmotionProbabilities;
  readonly moodReactivity: number;
  readonly moodDecaySeconds: number;
  readonly emotionWeight: number;
  readonly updateMood: boolean;
}): Promise<EmotionalStateResult> {
  const {
    dialogueId,
    emotionVAD,
    emotionCategories,
    moodReactivity,
    moodDecaySeconds,
    emotionWeight,
    updateMood,
  } = params;

  const existing = await loadMoodState(dialogueId);

  const now = new Date();
  const previousMood: VADValues = existing
    ? {
        valence: existing.moodValence,
        arousal: existing.moodArousal,
        dominance: existing.moodDominance,
      }
    : { ...NEUTRAL_VAD };
  const deltaSeconds = existing
    ? (now.getTime() - existing.lastUpdatedAt.getTime()) / 1000
    : 0;

  const turnCount = updateMood
    ? (existing?.turnCount ?? 0) + 1
    : (existing?.turnCount ?? 0);

  const updatedMoodVAD = updateMood
    ? updateMoodVAD({
        previousMood,
        currentEmotionVAD: emotionVAD,
        deltaSeconds,
        beta: effectiveReactivity(moodReactivity, emotionCategories["neutral"]),
        tau: moodDecaySeconds,
      })
    : previousMood;

  if (updateMood) {
    await saveMoodState(dialogueId, updatedMoodVAD, turnCount);
  }

  const moodCategories = vadToEmotionWeights(updatedMoodVAD);
  const moodTopEmotions = extractTopEmotions(moodCategories);

  const mood: MoodState = {
    vad: updatedMoodVAD,
    categories: moodCategories,
    topEmotions: moodTopEmotions,
    turnsSinceReset: turnCount,
  };

  const combinedCategories = combineEmotionAndMood(
    emotionCategories,
    moodCategories,
    emotionWeight,
  );
  const combinedVAD = categoriesToVAD(combinedCategories);

  const combinedEmotions: CombinedEmotionalState = {
    categories: combinedCategories,
    topEmotions: extractTopEmotions(combinedCategories),
    vad: combinedVAD,
  };

  return { mood, combinedEmotions };
}
