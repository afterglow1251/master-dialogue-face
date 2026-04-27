/**
 * Emotional State Service — ALMA-based mood layer.
 *
 * Implements a three-layer emotional model:
 *   1. Emotion (per-utterance, from RoBERTa) — already exists
 *   2. Mood (accumulated across dialogue turns) — this service
 *   3. Combined State (drives blendshape mapping) — this service
 *
 * Mood update formula:
 *   Mood(t) = β × E_vad(t) + (1-β) × [N + (Mood(t-1) - N) × e^(-Δt/τ)]
 *   where N = NEUTRAL_VAD, β = reactivity, τ = decay time constant
 *
 * Combined state formula:
 *   S(t) = w_e × EmotionCategories(t) + (1-w_e) × MoodCategories(t)
 */

import { eq } from "drizzle-orm";

import { EMOTION_VAD_CENTROIDS } from "../data/emotion-vad-centroids.ts";
import { db } from "../db/index.ts";
import { dialogueMoodStates } from "../db/schema.ts";
import {
  EMOTION_LABELS,
  NEUTRAL_VAD,
  type CombinedEmotionalState,
  type DialogueId,
  type EmotionLabel,
  type EmotionProbabilities,
  type EmotionScore,
  type MoodState,
  type VADValues,
} from "../types/index.ts";

// ── Pure computation functions (exported for unit testing) ──

/** Exponential decay: e^(-Δt/τ) */
export function computeDecay(deltaSeconds: number, tauSeconds: number): number {
  if (tauSeconds <= 0) return 0;
  return Math.exp(-deltaSeconds / tauSeconds);
}

/**
 * Updates mood VAD using the ALMA-based formula.
 *
 * Mood(t) = β × E_vad(t) + (1-β) × [N + (Mood(t-1) - N) × decay(Δt)]
 *
 * This ensures mood decays toward NEUTRAL_VAD over time,
 * and each new emotion nudges the mood proportionally to β.
 */
export function updateMoodVAD(params: {
  readonly previousMood: VADValues;
  readonly currentEmotionVAD: VADValues;
  readonly deltaSeconds: number;
  readonly beta: number;
  readonly tau: number;
}): VADValues {
  const { previousMood, currentEmotionVAD, deltaSeconds, beta, tau } = params;
  const decay = computeDecay(deltaSeconds, tau);

  function blend(dim: keyof VADValues, neutral: number): number {
    const decayed = neutral + (previousMood[dim] - neutral) * decay;
    const result = beta * currentEmotionVAD[dim] + (1 - beta) * decayed;
    return Math.min(1.0, Math.max(0.0, result));
  }

  return {
    valence: blend("valence", NEUTRAL_VAD.valence),
    arousal: blend("arousal", NEUTRAL_VAD.arousal),
    dominance: blend("dominance", NEUTRAL_VAD.dominance),
  };
}

/**
 * Converts a VAD point to emotion category weights via inverse-distance weighting.
 *
 * weight_i = 1 / (distance_i + ε)²
 * Normalized so weights sum to 1.
 */
export function vadToEmotionWeights(moodVAD: VADValues): EmotionProbabilities {
  const EPSILON = 0.001;

  const weights = new Map<EmotionLabel, number>();
  let weightSum = 0;

  for (const [emotion, centroid] of EMOTION_VAD_CENTROIDS) {
    const dv = moodVAD.valence - centroid.valence;
    const da = moodVAD.arousal - centroid.arousal;
    const dd = moodVAD.dominance - centroid.dominance;
    const distance = Math.sqrt(dv * dv + da * da + dd * dd);
    const w = 1 / ((distance + EPSILON) * (distance + EPSILON));
    weights.set(emotion, w);
    weightSum += w;
  }

  const result = {} as Record<EmotionLabel, number>;
  for (const label of EMOTION_LABELS) {
    result[label] = (weights.get(label) ?? 0) / weightSum;
  }

  return result as EmotionProbabilities;
}

/**
 * Combines per-utterance emotion and mood into a single category distribution.
 *
 * S(t) = w_e × EmotionCategories(t) + (1-w_e) × MoodCategories(t)
 * Result is re-normalized to sum to 1.
 */
export function combineEmotionAndMood(
  emotionCategories: EmotionProbabilities,
  moodCategories: EmotionProbabilities,
  emotionWeight: number,
): EmotionProbabilities {
  const moodWeight = 1 - emotionWeight;
  const result = {} as Record<EmotionLabel, number>;
  let sum = 0;

  for (const label of EMOTION_LABELS) {
    const v =
      emotionWeight * emotionCategories[label] +
      moodWeight * moodCategories[label];
    result[label] = v;
    sum += v;
  }

  if (sum > 0) {
    for (const label of EMOTION_LABELS) {
      result[label] /= sum;
    }
  }

  return result as EmotionProbabilities;
}

/** Extracts top-N emotions sorted by probability descending. */
export function extractTopEmotions(
  probabilities: EmotionProbabilities,
  n = 5,
): readonly EmotionScore[] {
  return (Object.entries(probabilities) as Array<[EmotionLabel, number]>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, probability]) => ({ name, probability }));
}

/** Computes weighted-average VAD from category probabilities. */
export function categoriesToVAD(
  probabilities: EmotionProbabilities,
): VADValues {
  let vSum = 0;
  let aSum = 0;
  let dSum = 0;
  let wSum = 0;

  for (const [emotion, centroid] of EMOTION_VAD_CENTROIDS) {
    const p = probabilities[emotion];
    vSum += p * centroid.valence;
    aSum += p * centroid.arousal;
    dSum += p * centroid.dominance;
    wSum += p;
  }

  if (wSum === 0) return { ...NEUTRAL_VAD };

  return {
    valence: vSum / wSum,
    arousal: aSum / wSum,
    dominance: dSum / wSum,
  };
}

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

export async function processEmotionalState(params: {
  readonly dialogueId: DialogueId;
  readonly emotionVAD: VADValues;
  readonly emotionCategories: EmotionProbabilities;
  readonly moodReactivity: number;
  readonly moodDecaySeconds: number;
  readonly emotionWeight: number;
}): Promise<EmotionalStateResult> {
  const {
    dialogueId,
    emotionVAD,
    emotionCategories,
    moodReactivity,
    moodDecaySeconds,
    emotionWeight,
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
  const turnCount = (existing?.turnCount ?? 0) + 1;

  const updatedMoodVAD = updateMoodVAD({
    previousMood,
    currentEmotionVAD: emotionVAD,
    deltaSeconds,
    beta: moodReactivity,
    tau: moodDecaySeconds,
  });

  await saveMoodState(dialogueId, updatedMoodVAD, turnCount);

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
