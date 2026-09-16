import { and, desc, eq } from "drizzle-orm";

import { db } from "../db/index.ts";
import { dialogues, dialogueTurns } from "../db/schema.ts";
import { mapEmotionsByMode } from "./blendshape-mapper.ts";
import { asymmetrySeedFromId } from "./expression-composer.ts";
import { analyzeEmotions } from "./emotion-analyzer.ts";
import * as emotionalState from "./emotional-state.service.ts";
import type { HistoryTurn } from "./llm.service.ts";
import type {
  BlendshapeVector,
  BlendshapesByMode,
  CharacterId,
  CombinedEmotionalState,
  DialogueId,
  EmotionAnalysisResult,
  EmotionProbabilities,
  ExpressionMode,
  MoodState,
  TurnRole,
  UserId,
  VADValues,
} from "../types/index.ts";
import { HttpError } from "../utils/errors.ts";

export async function createDialogue(
  userId: UserId,
  characterId: CharacterId,
  title?: string,
) {
  const [row] = await db
    .insert(dialogues)
    .values({ userId, characterId, title })
    .returning();
  return row;
}

export async function getDialoguesByUser(userId: UserId) {
  return db
    .select()
    .from(dialogues)
    .where(eq(dialogues.userId, userId))
    .orderBy(desc(dialogues.createdAt));
}

export async function verifyDialogueOwnership(
  dialogueId: DialogueId,
  userId: UserId,
): Promise<void> {
  const [dialogue] = await db
    .select({ id: dialogues.id })
    .from(dialogues)
    .where(and(eq(dialogues.id, dialogueId), eq(dialogues.userId, userId)));

  if (!dialogue) {
    throw new HttpError(404, "Dialogue not found");
  }
}

export async function getDialogueWithTurns(dialogueId: DialogueId) {
  const [dialogue] = await db
    .select()
    .from(dialogues)
    .where(eq(dialogues.id, dialogueId));

  if (!dialogue) return null;

  const turns = await db
    .select()
    .from(dialogueTurns)
    .where(eq(dialogueTurns.dialogueId, dialogueId))
    .orderBy(dialogueTurns.turnIndex);

  return { ...dialogue, turns };
}

export async function updateDialogueTitle(
  dialogueId: DialogueId,
  title: string,
) {
  const [row] = await db
    .update(dialogues)
    .set({ title, updatedAt: new Date() })
    .where(eq(dialogues.id, dialogueId))
    .returning();
  return row;
}

export async function deleteDialogue(dialogueId: DialogueId) {
  return db.delete(dialogues).where(eq(dialogues.id, dialogueId));
}

export async function getRecentTurns(
  dialogueId: DialogueId,
  limit: number,
): Promise<readonly HistoryTurn[]> {
  const rows = await db
    .select({ role: dialogueTurns.role, text: dialogueTurns.text })
    .from(dialogueTurns)
    .where(eq(dialogueTurns.dialogueId, dialogueId))
    .orderBy(desc(dialogueTurns.turnIndex))
    .limit(limit);

  return rows.reverse();
}

export async function getNextTurnIndex(
  dialogueId: DialogueId,
): Promise<number> {
  const [last] = await db
    .select({ turnIndex: dialogueTurns.turnIndex })
    .from(dialogueTurns)
    .where(eq(dialogueTurns.dialogueId, dialogueId))
    .orderBy(desc(dialogueTurns.turnIndex))
    .limit(1);

  return (last?.turnIndex ?? -1) + 1;
}

export async function saveTurn(params: {
  dialogueId: DialogueId;
  turnIndex: number;
  role: TurnRole;
  text: string;
  analysisText: string;
  emotionProbabilities: EmotionProbabilities;
  vadValues: VADValues;
  blendshapeVector: BlendshapeVector;
  processingTimeMs: number;
  moodVadSnapshot: VADValues;
  combinedProbabilities: EmotionProbabilities;
}) {
  const [row] = await db.insert(dialogueTurns).values(params).returning();
  return row;
}

export interface AnalyzeTurnResult {
  readonly turn: NonNullable<Awaited<ReturnType<typeof saveTurn>>>;
  readonly analysis: EmotionAnalysisResult;
  readonly blendshapes: BlendshapeVector;
  readonly blendshapesByMode: BlendshapesByMode;
  readonly mood: MoodState;
  readonly combinedEmotions: CombinedEmotionalState;
}

export async function analyzeAndSaveTurn(params: {
  dialogueId: DialogueId;
  role: TurnRole;
  text: string;
  analysisText: string;
  expressionIntensity?: number;
  expressionMode: ExpressionMode;
  moodReactivity: number;
  moodDecaySeconds: number;
  emotionWeight: number;
}): Promise<AnalyzeTurnResult> {
  const analysis = await analyzeEmotions(params.analysisText);

  const { mood, combinedEmotions } = await emotionalState.processEmotionalState(
    {
      dialogueId: params.dialogueId,
      emotionVAD: analysis.emotions.vad,
      emotionCategories: analysis.emotions.categories,
      moodReactivity: params.moodReactivity,
      moodDecaySeconds: params.moodDecaySeconds,
      emotionWeight: params.emotionWeight,
      updateMood: params.role !== "assistant",
    },
  );

  const blendshapesByMode = mapEmotionsByMode(combinedEmotions.categories, {
    intensityMultiplier: params.expressionIntensity,
    asymmetrySeed: asymmetrySeedFromId(params.dialogueId),
  });
  const blendshapes = blendshapesByMode[params.expressionMode];

  const turnIndex = await getNextTurnIndex(params.dialogueId);

  const turn = await saveTurn({
    dialogueId: params.dialogueId,
    turnIndex,
    role: params.role,
    text: params.text,
    analysisText: params.analysisText,
    emotionProbabilities: analysis.emotions.categories,
    vadValues: analysis.emotions.vad,
    blendshapeVector: blendshapes,
    processingTimeMs: analysis.processing_time_ms,
    moodVadSnapshot: mood.vad,
    combinedProbabilities: combinedEmotions.categories,
  });

  if (!turn) {
    throw new Error("Failed to save turn");
  }

  // Auto-title on first message
  if (turnIndex === 0) {
    const MAX_TITLE_LENGTH = 50;
    const autoTitle =
      params.text.length > MAX_TITLE_LENGTH
        ? params.text.slice(0, MAX_TITLE_LENGTH) + "…"
        : params.text;
    await updateDialogueTitle(params.dialogueId, autoTitle);
  }

  return {
    turn,
    analysis,
    blendshapes,
    blendshapesByMode,
    mood,
    combinedEmotions,
  };
}
