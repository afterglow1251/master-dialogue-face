import { describe, expect, test } from "bun:test";

import {
  AU_TO_BLENDSHAPES,
  ANTAGONIST_PAIRS,
  regionOf,
} from "../../src/data/action-units.ts";
import { EMOTION_ACTION_UNITS } from "../../src/data/emotion-action-units.ts";
import {
  aggregateActionUnits,
  composeExpression,
  intensityCurve,
  resolveAntagonists,
  selectActiveEmotions,
  signedHash,
} from "../../src/services/expression-composer.ts";
import {
  ARKIT_BLENDSHAPES,
  EMOTION_LABELS,
  type EmotionLabel,
  type EmotionProbabilities,
} from "../../src/types/index.ts";

const ASYMMETRY_AMPLITUDE = 0.12;
const NEAR_ZERO = 0.05;
const ASYMMETRY_SEED = 7;

function makeProbs(
  overrides: Partial<Record<EmotionLabel, number>>,
): EmotionProbabilities {
  const base: Record<EmotionLabel, number> = Object.fromEntries(
    EMOTION_LABELS.map((label) => [label, 0]),
  ) as Record<EmotionLabel, number>;
  return { ...base, ...overrides };
}

describe("selectActiveEmotions", () => {
  test("drops emotions below the relative gate", () => {
    const active = selectActiveEmotions(makeProbs({ joy: 0.9, sadness: 0.1 }));
    expect(active.map((e) => e.name)).toEqual(["joy"]);
  });

  test("drops every emotion below the absolute gate", () => {
    const active = selectActiveEmotions(makeProbs({ joy: 0.14, anger: 0.12 }));
    expect(active).toHaveLength(0);
  });

  test("all-zero probabilities select nothing", () => {
    expect(selectActiveEmotions(makeProbs({}))).toHaveLength(0);
  });

  test("ignores neutral even when it dominates", () => {
    const active = selectActiveEmotions(makeProbs({ neutral: 0.9, joy: 0.3 }));
    expect(active.map((e) => e.name)).toEqual(["joy"]);
  });

  test("returns emotions sorted by probability descending", () => {
    const active = selectActiveEmotions(
      makeProbs({ joy: 0.4, anger: 0.7, fear: 0.55 }),
    );
    expect(active.map((e) => e.name)).toEqual(["anger", "fear", "joy"]);
  });
});

describe("intensityCurve", () => {
  test("fixed points", () => {
    expect(intensityCurve(0)).toBe(0);
    expect(intensityCurve(0.5)).toBeCloseTo(0.5, 10);
    expect(intensityCurve(1)).toBeCloseTo(1, 10);
  });

  test("expands the upper range", () => {
    expect(intensityCurve(0.9)).toBeCloseTo(0.964, 3);
    expect(intensityCurve(0.9)).toBeGreaterThan(0.9);
  });

  test("is monotonically increasing", () => {
    let previous = -1;
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const value = intensityCurve(Math.min(1, p));
      expect(value).toBeGreaterThan(previous);
      previous = value;
    }
  });

  test("confidence scales the result down", () => {
    expect(intensityCurve(0.9, 0.5)).toBeCloseTo(intensityCurve(0.9) * 0.5, 10);
  });
});

describe("aggregateActionUnits", () => {
  test("takes the maximum over emotions, not the sum", () => {
    const shared = aggregateActionUnits([
      { name: "joy", probability: 0.8 },
      { name: "love", probability: 0.8 },
    ]);
    const solo = aggregateActionUnits([{ name: "joy", probability: 0.8 }]);
    expect(shared.get(12)).toBeCloseTo(solo.get(12) ?? 0, 10);
  });

  test("empty selection yields no action units", () => {
    expect(aggregateActionUnits([]).size).toBe(0);
  });
});

describe("resolveAntagonists", () => {
  test("suppresses the weaker unit of an opposing pair", () => {
    const resolved = resolveAntagonists(
      new Map([
        [12, 0.8],
        [15, 0.4],
      ]),
    );
    expect(resolved.get(12)).toBeCloseTo(0.8, 10);
    expect(resolved.get(15)).toBeCloseTo(0.4 * (1 - 0.8 * 0.4), 10);
  });

  test("leaves a pair untouched when only one unit is active", () => {
    const resolved = resolveAntagonists(new Map([[12, 0.8]]));
    expect(resolved.get(12)).toBeCloseTo(0.8, 10);
  });

  test("equal activations cancel no energy", () => {
    const resolved = resolveAntagonists(
      new Map([
        [12, 0.5],
        [15, 0.5],
      ]),
    );
    expect(resolved.get(12)).toBeCloseTo(0.5, 10);
    expect(resolved.get(15)).toBeCloseTo(0.5, 10);
  });
});

describe("composeExpression", () => {
  test("joy dominates a trace of sadness", () => {
    const result = composeExpression(makeProbs({ joy: 0.9, sadness: 0.1 }));
    expect(result.mouthSmileLeft).toBeGreaterThan(0.5);
    expect(result.mouthFrownLeft).toBeLessThan(NEAR_ZERO);
    expect(result.mouthFrownRight).toBeLessThan(NEAR_ZERO);
  });

  test("a mixed expression keeps both mouths active and damps the weaker", () => {
    const mixed = composeExpression(makeProbs({ joy: 0.6, sadness: 0.4 }));
    const joyOnly = composeExpression(makeProbs({ joy: 0.6 }));
    const sadnessOnly = composeExpression(makeProbs({ sadness: 0.4 }));

    expect(mixed.mouthSmileLeft).toBeGreaterThan(0);
    expect(mixed.mouthFrownLeft).toBeGreaterThan(0);
    expect(mixed.mouthFrownLeft).toBeLessThan(sadnessOnly.mouthFrownLeft);
    expect(mixed.mouthSmileLeft).toBeLessThanOrEqual(joyOnly.mouthSmileLeft);
  });

  test("surprise raises brows and drops the jaw without brow lowering", () => {
    const result = composeExpression(makeProbs({ surprise: 0.9 }));
    expect(result.browInnerUp).toBeGreaterThan(0.5);
    expect(result.browOuterUpLeft).toBeGreaterThan(0.5);
    expect(result.browOuterUpRight).toBeGreaterThan(0.5);
    expect(result.jawOpen).toBeGreaterThan(0.5);
    expect(result.browDownLeft).toBeLessThan(NEAR_ZERO);
    expect(result.browDownRight).toBeLessThan(NEAR_ZERO);
  });

  test("no active emotion produces a neutral face", () => {
    const result = composeExpression(makeProbs({ neutral: 1.0 }));
    for (const name of ARKIT_BLENDSHAPES) {
      expect(result[name]).toBe(0);
    }
  });

  test("neutral probability lowers the overall activation", () => {
    const confident = composeExpression(makeProbs({ joy: 0.8 }));
    const hedged = composeExpression(makeProbs({ joy: 0.8, neutral: 0.5 }));
    expect(hedged.mouthSmileLeft).toBeLessThan(confident.mouthSmileLeft);
    expect(hedged.mouthSmileLeft).toBeGreaterThan(0);
  });

  test("intensity multiplier scales activation and stays clamped", () => {
    const low = composeExpression(makeProbs({ anger: 0.8 }), 0.5);
    const high = composeExpression(makeProbs({ anger: 0.8 }), 2.0);
    expect(low.browDownLeft).toBeLessThan(high.browDownLeft);
    for (const name of ARKIT_BLENDSHAPES) {
      expect(high[name]).toBeGreaterThanOrEqual(0);
      expect(high[name]).toBeLessThanOrEqual(1);
    }
  });

  test("every emotion produces values inside [0, 1]", () => {
    for (const label of EMOTION_LABELS) {
      const result = composeExpression(makeProbs({ [label]: 0.9 }), 1, 3);
      for (const name of ARKIT_BLENDSHAPES) {
        expect(result[name]).toBeGreaterThanOrEqual(0);
        expect(result[name]).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("asymmetry", () => {
  test("seed 0 keeps both sides identical", () => {
    const result = composeExpression(makeProbs({ joy: 0.9 }));
    expect(result.mouthSmileLeft).toBe(result.mouthSmileRight);
    expect(result.cheekSquintLeft).toBe(result.cheekSquintRight);
  });

  test("a non-zero seed breaks symmetry within the amplitude bound", () => {
    const symmetric = composeExpression(makeProbs({ joy: 0.9 }));
    const asymmetric = composeExpression(
      makeProbs({ joy: 0.9 }),
      1,
      ASYMMETRY_SEED,
    );

    expect(asymmetric.mouthSmileLeft).not.toBe(asymmetric.mouthSmileRight);

    const bound = 2 * ASYMMETRY_AMPLITUDE * symmetric.mouthSmileLeft;
    const delta = Math.abs(
      asymmetric.mouthSmileLeft - asymmetric.mouthSmileRight,
    );
    expect(delta).toBeLessThanOrEqual(bound + 1e-9);

    for (const name of ARKIT_BLENDSHAPES) {
      expect(asymmetric[name]).toBeGreaterThanOrEqual(0);
      expect(asymmetric[name]).toBeLessThanOrEqual(1);
    }
  });

  test("the same seed always produces the same face", () => {
    const first = composeExpression(
      makeProbs({ anger: 0.8 }),
      1,
      ASYMMETRY_SEED,
    );
    const second = composeExpression(
      makeProbs({ anger: 0.8 }),
      1,
      ASYMMETRY_SEED,
    );
    for (const name of ARKIT_BLENDSHAPES) {
      expect(first[name]).toBe(second[name]);
    }
  });

  test("the offset is not biased toward one side", () => {
    const features = ARKIT_BLENDSHAPES.filter((name) => name.endsWith("Left"));
    const positive = features.filter(
      (name) => signedHash(ASYMMETRY_SEED, name) > 0,
    );
    expect(positive.length).toBeGreaterThan(0);
    expect(positive.length).toBeLessThan(features.length);
  });
});

describe("action unit tables", () => {
  test("all 28 emotion labels are covered", () => {
    expect(EMOTION_ACTION_UNITS.size).toBe(EMOTION_LABELS.length);
    for (const label of EMOTION_LABELS) {
      expect(EMOTION_ACTION_UNITS.has(label)).toBe(true);
    }
  });

  test("neutral has no action units", () => {
    expect(EMOTION_ACTION_UNITS.get("neutral")).toEqual([]);
  });

  test("every referenced action unit has a blendshape mapping", () => {
    for (const [label, pattern] of EMOTION_ACTION_UNITS) {
      for (const entry of pattern) {
        expect(`${label}:${AU_TO_BLENDSHAPES.has(entry.au)}`).toBe(
          `${label}:true`,
        );
        expect(entry.intensity).toBeGreaterThan(0);
        expect(entry.intensity).toBeLessThanOrEqual(1);
      }
    }
  });

  test("every mapped blendshape is a real ARKit name", () => {
    const names: ReadonlySet<string> = new Set(ARKIT_BLENDSHAPES);
    for (const targets of AU_TO_BLENDSHAPES.values()) {
      for (const target of targets) {
        expect(names.has(target)).toBe(true);
      }
    }
  });

  test("antagonist pairs reference mapped action units", () => {
    for (const [first, second] of ANTAGONIST_PAIRS) {
      expect(AU_TO_BLENDSHAPES.has(first)).toBe(true);
      expect(AU_TO_BLENDSHAPES.has(second)).toBe(true);
    }
  });

  test("every action unit belongs to exactly one face region", () => {
    for (const au of AU_TO_BLENDSHAPES.keys()) {
      expect(["upper", "lower"]).toContain(regionOf(au));
    }
  });
});
