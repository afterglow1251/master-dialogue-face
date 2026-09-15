import Anthropic from "@anthropic-ai/sdk";
import { InferenceClientError } from "@huggingface/inference";

import { config } from "../config.ts";
import type {
  WsBlendshapeResult,
  WsServerMessage,
  WsSpeechChunk,
} from "@shared/types/websocket.ts";
import type {
  DialogueId,
  EmotionProbabilities,
  SpeechLanguage,
  TurnRole,
} from "../types/index.ts";
import type { SentenceEvent } from "../utils/reply-format.ts";
import { mapEmotionsToBlendshapes } from "./blendshape-mapper.ts";
import * as dialogueService from "./dialogue.service.ts";
import { analyzeEmotions } from "./emotion-analyzer.ts";
import * as emotionalState from "./emotional-state.service.ts";
import { LlmRefusalError, streamReply } from "./llm.service.ts";
import { TtsError, synthesizeSpeech } from "./tts.service.ts";

export interface ConversationSettings {
  readonly expressionIntensity: number;
  readonly moodReactivity: number;
  readonly moodDecaySeconds: number;
  readonly emotionWeight: number;
}

type Settled<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: unknown };

function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  return promise.then(
    (value) => ({ ok: true, value }),
    (error: unknown) => ({ ok: false, error }),
  );
}

async function saveTurn(params: {
  readonly requestId: string;
  readonly dialogueId: DialogueId;
  readonly role: TurnRole;
  readonly text: string;
  readonly analysisText: string;
  readonly settings: ConversationSettings;
}): Promise<WsBlendshapeResult> {
  const { turn, analysis, blendshapes, mood, combinedEmotions } =
    await dialogueService.analyzeAndSaveTurn({
      dialogueId: params.dialogueId,
      role: params.role,
      text: params.text,
      analysisText: params.analysisText,
      ...params.settings,
    });

  return {
    type: "blendshape_update",
    requestId: params.requestId,
    role: params.role,
    turnId: turn.id,
    text: params.text,
    emotions: {
      categories: analysis.emotions.categories,
      vad: analysis.emotions.vad,
      topEmotions: analysis.emotions.top_emotions,
    },
    mood,
    combinedEmotions,
    blendshapes,
    processingTimeMs: analysis.processing_time_ms,
  };
}

async function prepareSpeechChunk(params: {
  readonly requestId: string;
  readonly index: number;
  readonly sentence: SentenceEvent;
  readonly previousText: string;
  readonly language: SpeechLanguage;
  readonly expressionIntensity: number;
  readonly emotionWeight: number;
  readonly moodCategories: Promise<EmotionProbabilities>;
  readonly signal: AbortSignal;
}): Promise<WsSpeechChunk> {
  const [speech, analysis, moodCategories] = await Promise.all([
    synthesizeSpeech({
      text: params.sentence.text,
      language: params.language,
      previousText: params.previousText,
      signal: params.signal,
    }),
    analyzeEmotions(params.sentence.analysisText, params.signal),
    params.moodCategories,
  ]);

  const combinedCategories = emotionalState.combineEmotionAndMood(
    analysis.emotions.categories,
    moodCategories,
    params.emotionWeight,
  );

  return {
    type: "speech_chunk",
    requestId: params.requestId,
    index: params.index,
    text: params.sentence.text,
    audioBase64: speech.audioBase64,
    alignment: speech.alignment,
    emotions: {
      categories: analysis.emotions.categories,
      vad: analysis.emotions.vad,
      topEmotions: analysis.emotions.top_emotions,
    },
    blendshapes: mapEmotionsToBlendshapes(
      combinedCategories,
      params.expressionIntensity,
    ),
  };
}

export async function runConversationTurn(params: {
  readonly requestId: string;
  readonly dialogueId: DialogueId;
  readonly text: string;
  readonly language: SpeechLanguage;
  readonly settings: ConversationSettings;
  readonly signal: AbortSignal;
  readonly send: (message: WsServerMessage) => void;
}): Promise<void> {
  const failureController = new AbortController();
  const signal = AbortSignal.any([params.signal, failureController.signal]);
  const state: { failure: { readonly error: unknown } | null } = {
    failure: null,
  };

  function fail(error: unknown) {
    if (state.failure === null) state.failure = { error };
    failureController.abort();
  }

  function deliver(message: WsServerMessage) {
    if (!signal.aborted) params.send(message);
  }

  const history = await dialogueService.getRecentTurns(
    params.dialogueId,
    config.llm.historyTurns,
  );

  let userTurn: Promise<Settled<WsBlendshapeResult>> | null = null;
  function startUserTurn(analysisText: string) {
    userTurn ??= settle(
      saveTurn({
        requestId: params.requestId,
        dialogueId: params.dialogueId,
        role: "user",
        text: params.text,
        analysisText,
        settings: params.settings,
      }),
    ).then((result) => {
      if (result.ok) deliver(result.value);
      else fail(result.error);
      return result;
    });
  }

  let moodCategories: Promise<EmotionProbabilities> | null = null;
  function currentMoodCategories(): Promise<EmotionProbabilities> {
    moodCategories ??= Promise.resolve(userTurn).then(() =>
      emotionalState.getMoodCategories(params.dialogueId),
    );
    return moodCategories;
  }

  const sentences: SentenceEvent[] = [];
  let delivery: Promise<void> = Promise.resolve();

  try {
    for await (const event of streamReply({
      history,
      userText: params.text,
      language: params.language,
      signal,
    })) {
      if (event.type === "user_translation") {
        startUserTurn(event.analysisText);
        continue;
      }

      const prepared = settle(
        prepareSpeechChunk({
          requestId: params.requestId,
          index: sentences.length,
          sentence: event,
          previousText: sentences.map((s) => s.text).join(" "),
          language: params.language,
          expressionIntensity: params.settings.expressionIntensity,
          emotionWeight: params.settings.emotionWeight,
          moodCategories: currentMoodCategories(),
          signal,
        }),
      );
      sentences.push(event);

      delivery = delivery.then(async () => {
        const result = await prepared;
        if (result.ok) deliver(result.value);
        else fail(result.error);
      });
    }
  } catch (error) {
    if (!signal.aborted) fail(error);
  }

  if (!signal.aborted) startUserTurn(params.text);
  await delivery;
  await userTurn;

  if (params.signal.aborted) return;
  if (state.failure !== null) throw state.failure.error;

  if (sentences.length > 0) {
    const assistantTurn = await saveTurn({
      requestId: params.requestId,
      dialogueId: params.dialogueId,
      role: "assistant",
      text: sentences.map((s) => s.text).join(" "),
      analysisText: sentences.map((s) => s.analysisText).join(" "),
      settings: params.settings,
    });
    deliver(assistantTurn);
  }

  deliver({ type: "reply_end", requestId: params.requestId });
}

export function describeConversationError(error: unknown): string {
  if (error instanceof LlmRefusalError) return error.message;
  if (error instanceof Anthropic.AuthenticationError) {
    return "Anthropic API key is invalid or missing (check ANTHROPIC_API_KEY)";
  }
  if (error instanceof Anthropic.RateLimitError) {
    return "Anthropic rate limit reached, please retry in a moment";
  }
  if (error instanceof Anthropic.APIError) {
    return `Anthropic API error (${error.status ?? "no status"}): ${error.message}`;
  }
  if (error instanceof TtsError) return error.message;
  if (error instanceof InferenceClientError) {
    return `Emotion model request failed (Hugging Face): ${error.message}`;
  }
  if (error instanceof Error) return error.message;
  return "Unknown conversation error";
}
