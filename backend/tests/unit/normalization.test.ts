import { describe, expect, test } from "bun:test";

import { normalizeProbabilities } from "@shared/math/index.ts";
import { EMOTION_LABELS, type EmotionLabel } from "../../src/types/index.ts";

function makeProbs(
  overrides: Partial<Record<EmotionLabel, number>>,
): Record<EmotionLabel, number> {
  const base = Object.fromEntries(EMOTION_LABELS.map((l) => [l, 0])) as Record<
    EmotionLabel,
    number
  >;
  return { ...base, ...overrides };
}

describe("normalizeProbabilities", () => {
  test("single non-zero emotion gets probability 1.0", () => {
    const result = normalizeProbabilities(makeProbs({ joy: 0.8 }));
    expect(result.joy).toBeCloseTo(1.0);
    expect(result.sadness).toBeCloseTo(0.0);
  });

  test("two equal probabilities each get 0.5", () => {
    const result = normalizeProbabilities(
      makeProbs({ joy: 0.5, sadness: 0.5 }),
    );
    expect(result.joy).toBeCloseTo(0.5);
    expect(result.sadness).toBeCloseTo(0.5);
  });

  test("result sums to 1.0", () => {
    const result = normalizeProbabilities(
      makeProbs({ joy: 0.8, anger: 0.3, fear: 0.1 }),
    );
    const sum = Object.values(result).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0);
  });

  test("preserves relative proportions", () => {
    const result = normalizeProbabilities(
      makeProbs({ joy: 0.6, sadness: 0.3 }),
    );
    // joy should be 2x sadness
    expect(result.joy / result.sadness).toBeCloseTo(2.0);
  });

  test("all zeros gives a pure neutral distribution", () => {
    const result = normalizeProbabilities(makeProbs({}));
    expect(result.neutral).toBeCloseTo(1.0);
    for (const label of EMOTION_LABELS) {
      if (label !== "neutral") expect(result[label]).toBeCloseTo(0.0);
    }
  });

  test("probability magnitude does not affect result", () => {
    const small = normalizeProbabilities(makeProbs({ joy: 0.01, anger: 0.01 }));
    const large = normalizeProbabilities(makeProbs({ joy: 100, anger: 100 }));
    expect(small.joy).toBeCloseTo(large.joy);
    expect(small.anger).toBeCloseTo(large.anger);
  });

  test("dominant emotion gets highest normalized weight", () => {
    const result = normalizeProbabilities(
      makeProbs({ joy: 0.9, sadness: 0.05, anger: 0.05 }),
    );
    expect(result.joy).toBeGreaterThan(result.sadness);
    expect(result.joy).toBeGreaterThan(result.anger);
  });
});
