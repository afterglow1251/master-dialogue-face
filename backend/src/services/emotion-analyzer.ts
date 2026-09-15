import { InferenceClient } from "@huggingface/inference";

import { config } from "../config.ts";
import { EMOTION_LABELS, type EmotionAnalysisResult } from "../types/index.ts";
import { toEmotionProbabilities } from "../utils/emotion-scores.ts";
import {
  categoriesToVAD,
  extractTopEmotions,
} from "./emotional-state.service.ts";

const HF_PROVIDER = "hf-inference";
const MODEL_LABEL_COUNT = EMOTION_LABELS.length;

const client = new InferenceClient(config.emotion.hfToken);

export async function analyzeEmotions(
  text: string,
  signal?: AbortSignal,
): Promise<EmotionAnalysisResult> {
  const startedAt = performance.now();
  const timeout = AbortSignal.timeout(config.emotion.timeoutMs);

  const scores = await client.textClassification(
    {
      model: config.emotion.model,
      provider: HF_PROVIDER,
      inputs: text,
      parameters: {
        function_to_apply: "sigmoid",
        top_k: MODEL_LABEL_COUNT,
      },
    },
    { signal: signal ? AbortSignal.any([signal, timeout]) : timeout },
  );

  const categories = toEmotionProbabilities(scores);

  return {
    text,
    emotions: {
      categories,
      vad: categoriesToVAD(categories),
      top_emotions: extractTopEmotions(categories),
    },
    processing_time_ms: performance.now() - startedAt,
  };
}
