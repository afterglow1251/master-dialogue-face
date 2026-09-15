import { describe, expect, test } from "bun:test";

import {
  buildModelInput,
  toEmotionProbabilities,
} from "../../src/utils/emotion-scores.ts";
import { EMOTION_LABELS } from "../../src/types/index.ts";

describe("buildModelInput", () => {
  test("returns text unchanged without context", () => {
    expect(buildModelInput("I am happy", [])).toBe("I am happy");
  });

  test("appends context turns with RoBERTa separator", () => {
    expect(buildModelInput("Now", ["First", "Second"])).toBe(
      "Now </s> First </s> Second",
    );
  });
});

describe("toEmotionProbabilities", () => {
  test("drops neutral and unknown labels, fills missing with zero", () => {
    const result = toEmotionProbabilities([
      { label: "joy", score: 0.9 },
      { label: "neutral", score: 0.8 },
      { label: "happiness", score: 0.5 },
    ]);

    expect(Object.keys(result).sort()).toEqual([...EMOTION_LABELS].sort());
    expect(result.joy).toBe(0.9);
    expect(result.anger).toBe(0);
  });
});
