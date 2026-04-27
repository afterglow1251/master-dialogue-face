import { describe, expect, test } from "bun:test";

import {
  isEmotionAnalysisResult,
  isEmotionLabel,
} from "../../src/types/emotion.ts";
import { EMOTION_LABELS } from "../../src/types/index.ts";

describe("isEmotionLabel", () => {
  test("accepts all 27 GoEmotions labels", () => {
    for (const label of EMOTION_LABELS) {
      expect(isEmotionLabel(label)).toBe(true);
    }
  });

  test("has exactly 27 labels", () => {
    expect(EMOTION_LABELS.length).toBe(27);
  });

  test("rejects neutral", () => {
    expect(isEmotionLabel("neutral")).toBe(false);
  });

  test("rejects unknown string", () => {
    expect(isEmotionLabel("happiness")).toBe(false);
    expect(isEmotionLabel("")).toBe(false);
  });

  test("rejects uppercase variant", () => {
    expect(isEmotionLabel("Joy")).toBe(false);
    expect(isEmotionLabel("ANGER")).toBe(false);
  });
});

// Valid NLP response fixture
const VALID_RESULT = {
  text: "I feel great",
  processing_time_ms: 42.5,
  emotions: {
    categories: { joy: 0.9, sadness: 0.1 },
    vad: { valence: 0.95, arousal: 0.7, dominance: 0.6 },
    top_emotions: [{ name: "joy", probability: 0.9 }],
  },
};

describe("isEmotionAnalysisResult", () => {
  test("accepts valid NLP response", () => {
    expect(isEmotionAnalysisResult(VALID_RESULT)).toBe(true);
  });

  test("rejects null", () => {
    expect(isEmotionAnalysisResult(null)).toBe(false);
  });

  test("rejects undefined", () => {
    expect(isEmotionAnalysisResult(undefined)).toBe(false);
  });

  test("rejects string", () => {
    expect(isEmotionAnalysisResult("hello")).toBe(false);
  });

  test("rejects empty object", () => {
    expect(isEmotionAnalysisResult({})).toBe(false);
  });

  test("rejects missing text", () => {
    const { text: _, ...rest } = VALID_RESULT;
    expect(isEmotionAnalysisResult(rest)).toBe(false);
  });

  test("rejects non-string text", () => {
    expect(isEmotionAnalysisResult({ ...VALID_RESULT, text: 123 })).toBe(false);
  });

  test("rejects missing processing_time_ms", () => {
    const { processing_time_ms: _, ...rest } = VALID_RESULT;
    expect(isEmotionAnalysisResult(rest)).toBe(false);
  });

  test("rejects missing emotions", () => {
    const { emotions: _, ...rest } = VALID_RESULT;
    expect(isEmotionAnalysisResult(rest)).toBe(false);
  });

  test("rejects missing vad", () => {
    const bad = {
      ...VALID_RESULT,
      emotions: { ...VALID_RESULT.emotions, vad: null },
    };
    expect(isEmotionAnalysisResult(bad)).toBe(false);
  });

  test("rejects missing vad.valence", () => {
    const bad = {
      ...VALID_RESULT,
      emotions: {
        ...VALID_RESULT.emotions,
        vad: { arousal: 0.5, dominance: 0.5 },
      },
    };
    expect(isEmotionAnalysisResult(bad)).toBe(false);
  });

  test("rejects non-array top_emotions", () => {
    const bad = {
      ...VALID_RESULT,
      emotions: { ...VALID_RESULT.emotions, top_emotions: "not array" },
    };
    expect(isEmotionAnalysisResult(bad)).toBe(false);
  });

  test("rejects missing categories", () => {
    const bad = {
      ...VALID_RESULT,
      emotions: { ...VALID_RESULT.emotions, categories: null },
    };
    expect(isEmotionAnalysisResult(bad)).toBe(false);
  });
});
