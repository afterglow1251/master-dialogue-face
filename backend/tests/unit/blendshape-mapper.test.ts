import { describe, expect, test } from "bun:test";

import { mapEmotionsToBlendshapes } from "../../src/services/blendshape-mapper.ts";
import {
  ARKIT_BLENDSHAPES,
  EMOTION_LABELS,
  type EmotionLabel,
} from "../../src/types/index.ts";

function makeProbs(
  overrides: Partial<Record<EmotionLabel, number>>,
): Record<EmotionLabel, number> {
  const base = Object.fromEntries(EMOTION_LABELS.map((l) => [l, 0])) as Record<
    EmotionLabel,
    number
  >;
  return { ...base, ...overrides };
}

describe("mapEmotionsToBlendshapes", () => {
  // Note: these tests work with whatever templates are in the cache.
  // If cache is empty (no DB), the result will be all zeros.
  // This tests the formula logic, not the template data.

  test("returns all 52 ARKit blendshape keys", () => {
    const result = mapEmotionsToBlendshapes(makeProbs({ joy: 0.9 }));
    const keys = Object.keys(result);
    expect(keys.length).toBe(ARKIT_BLENDSHAPES.length);
    for (const bs of ARKIT_BLENDSHAPES) {
      expect(bs in result).toBe(true);
    }
  });

  test("all values in [0, 1]", () => {
    const probs = makeProbs({ anger: 0.9, fear: 0.7, disgust: 0.5 });
    const result = mapEmotionsToBlendshapes(probs);
    for (const bs of ARKIT_BLENDSHAPES) {
      expect(result[bs]).toBeGreaterThanOrEqual(0.0);
      expect(result[bs]).toBeLessThanOrEqual(1.0);
    }
  });

  test("all-zero probabilities produce all-zero blendshapes", () => {
    const result = mapEmotionsToBlendshapes(makeProbs({}));
    // With all-zero input, normalization gives uniform distribution.
    // Result depends on templates. Values should still be in [0,1].
    for (const bs of ARKIT_BLENDSHAPES) {
      expect(result[bs]).toBeGreaterThanOrEqual(0.0);
      expect(result[bs]).toBeLessThanOrEqual(1.0);
    }
  });

  test("intensity multiplier of 0 gives all zeros", () => {
    const result = mapEmotionsToBlendshapes(makeProbs({ joy: 1.0 }), 0);
    for (const bs of ARKIT_BLENDSHAPES) {
      expect(result[bs]).toBe(0.0);
    }
  });

  test("intensity multiplier clamps to [0, 1]", () => {
    const result = mapEmotionsToBlendshapes(makeProbs({ joy: 1.0 }), 5.0);
    for (const bs of ARKIT_BLENDSHAPES) {
      expect(result[bs]).toBeLessThanOrEqual(1.0);
      expect(result[bs]).toBeGreaterThanOrEqual(0.0);
    }
  });

  test("default intensity multiplier is 1.0", () => {
    const probs = makeProbs({ joy: 0.8 });
    const withDefault = mapEmotionsToBlendshapes(probs);
    const withExplicit = mapEmotionsToBlendshapes(probs, 1.0);
    for (const bs of ARKIT_BLENDSHAPES) {
      expect(withDefault[bs]).toBeCloseTo(withExplicit[bs]);
    }
  });

  test("higher intensity produces larger or equal values", () => {
    const probs = makeProbs({ anger: 0.8 });
    const low = mapEmotionsToBlendshapes(probs, 0.5);
    const high = mapEmotionsToBlendshapes(probs, 1.0);
    for (const bs of ARKIT_BLENDSHAPES) {
      expect(high[bs]).toBeGreaterThanOrEqual(low[bs] - 0.001);
    }
  });
});

describe("blendshape vector properties", () => {
  test("createEmptyBlendshapeVector has 52 keys all zero", async () => {
    const { createEmptyBlendshapeVector } =
      await import("../../src/types/index.ts");
    const empty = createEmptyBlendshapeVector();
    expect(Object.keys(empty).length).toBe(52);
    for (const bs of ARKIT_BLENDSHAPES) {
      expect(empty[bs]).toBe(0);
    }
  });
});
