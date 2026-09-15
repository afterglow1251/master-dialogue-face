import { describe, expect, test } from "bun:test";

import { toEmotionProbabilities } from "../../src/utils/emotion-scores.ts";
import { EMOTION_LABELS } from "../../src/types/index.ts";

describe("toEmotionProbabilities", () => {
  test("keeps neutral, drops unknown labels, fills missing with zero", () => {
    const result = toEmotionProbabilities([
      { label: "joy", score: 0.9 },
      { label: "neutral", score: 0.8 },
      { label: "happiness", score: 0.5 },
    ]);

    expect(Object.keys(result).sort()).toEqual([...EMOTION_LABELS].sort());
    expect(result.joy).toBe(0.9);
    expect(result.neutral).toBe(0.8);
    expect(result.anger).toBe(0);
  });
});
