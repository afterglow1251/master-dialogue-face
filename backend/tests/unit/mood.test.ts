import { describe, expect, test } from "bun:test";

import {
  computeDecay,
  updateMoodVAD,
  vadToEmotionWeights,
  effectiveReactivity,
  combineEmotionAndMood,
  extractTopEmotions,
  categoriesToVAD,
} from "@shared/math/index.ts";
import {
  EMOTION_LABELS,
  NEUTRAL_VAD,
  type EmotionLabel,
  type EmotionProbabilities,
  type VADValues,
} from "../../src/types/index.ts";
import { EMOTION_VAD_CENTROIDS } from "@shared/tables/index.ts";

// ── Helpers ──

function makeProbs(
  overrides: Partial<Record<EmotionLabel, number>>,
): EmotionProbabilities {
  const base = Object.fromEntries(EMOTION_LABELS.map((l) => [l, 0])) as Record<
    EmotionLabel,
    number
  >;
  return { ...base, ...overrides } as EmotionProbabilities;
}

function sumValues(probs: EmotionProbabilities): number {
  return Object.values(probs).reduce((a, b) => a + b, 0);
}

// ── computeDecay ──

describe("computeDecay", () => {
  test("returns 1.0 when deltaSeconds is 0", () => {
    expect(computeDecay(0, 100)).toBeCloseTo(1.0);
  });

  test("returns e^(-1) ≈ 0.368 when delta equals tau", () => {
    expect(computeDecay(10, 10)).toBeCloseTo(Math.exp(-1));
  });

  test("returns 0 when tauSeconds is 0", () => {
    expect(computeDecay(5, 0)).toBe(0);
  });

  test("returns near-0 for very large delta relative to tau", () => {
    const result = computeDecay(10000, 1);
    expect(result).toBeCloseTo(0.0, 5);
  });

  test("returns near-1.0 for very small delta relative to tau", () => {
    const result = computeDecay(0.001, 1000);
    expect(result).toBeCloseTo(1.0, 4);
  });

  test("larger delta produces smaller decay", () => {
    const short = computeDecay(1, 10);
    const long = computeDecay(5, 10);
    expect(short).toBeGreaterThan(long);
  });

  test("larger tau produces slower decay (higher value)", () => {
    const fastDecay = computeDecay(10, 5);
    const slowDecay = computeDecay(10, 50);
    expect(slowDecay).toBeGreaterThan(fastDecay);
  });
});

// ── updateMoodVAD ──

describe("updateMoodVAD", () => {
  const joyVAD: VADValues = { valence: 0.98, arousal: 0.824, dominance: 0.794 };

  test("beta=1.0 returns currentEmotionVAD regardless of previous mood", () => {
    const result = updateMoodVAD({
      previousMood: NEUTRAL_VAD,
      currentEmotionVAD: joyVAD,
      deltaSeconds: 0,
      beta: 1.0,
      tau: 100,
    });
    expect(result.valence).toBeCloseTo(joyVAD.valence);
    expect(result.arousal).toBeCloseTo(joyVAD.arousal);
    expect(result.dominance).toBeCloseTo(joyVAD.dominance);
  });

  test("beta=0.0 and delta=0 preserves previous mood exactly", () => {
    const prev: VADValues = { valence: 0.8, arousal: 0.6, dominance: 0.7 };
    const result = updateMoodVAD({
      previousMood: prev,
      currentEmotionVAD: joyVAD,
      deltaSeconds: 0,
      beta: 0.0,
      tau: 100,
    });
    // decay=1 when delta=0, so decayed = N + (prev - N)*1 = prev
    expect(result.valence).toBeCloseTo(prev.valence);
    expect(result.arousal).toBeCloseTo(prev.arousal);
    expect(result.dominance).toBeCloseTo(prev.dominance);
  });

  test("beta=0.0 and very large delta decays toward NEUTRAL_VAD", () => {
    const extremeVAD: VADValues = {
      valence: 1.0,
      arousal: 1.0,
      dominance: 1.0,
    };
    const result = updateMoodVAD({
      previousMood: extremeVAD,
      currentEmotionVAD: joyVAD,
      deltaSeconds: 100000,
      beta: 0.0,
      tau: 10,
    });
    expect(result.valence).toBeCloseTo(NEUTRAL_VAD.valence, 2);
    expect(result.arousal).toBeCloseTo(NEUTRAL_VAD.arousal, 2);
    expect(result.dominance).toBeCloseTo(NEUTRAL_VAD.dominance, 2);
  });

  test("result is always clamped to [0, 1]", () => {
    const edgeCases: VADValues[] = [
      { valence: 0.0, arousal: 0.0, dominance: 0.0 },
      { valence: 1.0, arousal: 1.0, dominance: 1.0 },
    ];

    for (const prev of edgeCases) {
      for (const curr of edgeCases) {
        const result = updateMoodVAD({
          previousMood: prev,
          currentEmotionVAD: curr,
          deltaSeconds: 5,
          beta: 0.5,
          tau: 10,
        });
        expect(result.valence).toBeGreaterThanOrEqual(0.0);
        expect(result.valence).toBeLessThanOrEqual(1.0);
        expect(result.arousal).toBeGreaterThanOrEqual(0.0);
        expect(result.arousal).toBeLessThanOrEqual(1.0);
        expect(result.dominance).toBeGreaterThanOrEqual(0.0);
        expect(result.dominance).toBeLessThanOrEqual(1.0);
      }
    }
  });

  test("manual ALMA formula verification", () => {
    const prev: VADValues = { valence: 0.8, arousal: 0.6, dominance: 0.7 };
    const curr: VADValues = { valence: 0.2, arousal: 0.9, dominance: 0.3 };
    const beta = 0.3;
    const tau = 60;
    const delta = 30;

    const decay = Math.exp(-delta / tau);
    const expectedV =
      beta * curr.valence +
      (1 - beta) *
        (NEUTRAL_VAD.valence + (prev.valence - NEUTRAL_VAD.valence) * decay);
    const expectedA =
      beta * curr.arousal +
      (1 - beta) *
        (NEUTRAL_VAD.arousal + (prev.arousal - NEUTRAL_VAD.arousal) * decay);
    const expectedD =
      beta * curr.dominance +
      (1 - beta) *
        (NEUTRAL_VAD.dominance +
          (prev.dominance - NEUTRAL_VAD.dominance) * decay);

    const result = updateMoodVAD({
      previousMood: prev,
      currentEmotionVAD: curr,
      deltaSeconds: delta,
      beta,
      tau,
    });

    expect(result.valence).toBeCloseTo(expectedV);
    expect(result.arousal).toBeCloseTo(expectedA);
    expect(result.dominance).toBeCloseTo(expectedD);
  });
});

// ── vadToEmotionWeights ──

describe("vadToEmotionWeights", () => {
  test("returns all 28 emotion keys", () => {
    const result = vadToEmotionWeights(NEUTRAL_VAD);
    const keys = Object.keys(result);
    expect(keys.length).toBe(28);
    for (const label of EMOTION_LABELS) {
      expect(label in result).toBe(true);
    }
  });

  test("all weights are non-negative", () => {
    const result = vadToEmotionWeights(NEUTRAL_VAD);
    for (const label of EMOTION_LABELS) {
      expect(result[label]).toBeGreaterThanOrEqual(0);
    }
  });

  test("weights sum to approximately 1.0", () => {
    const result = vadToEmotionWeights(NEUTRAL_VAD);
    expect(sumValues(result)).toBeCloseTo(1.0);
  });

  test("joy centroid produces highest weight for joy", () => {
    const joyCentroid = EMOTION_VAD_CENTROIDS.get("joy")!;
    const result = vadToEmotionWeights(joyCentroid);
    const joyWeight = result.joy;
    for (const label of EMOTION_LABELS) {
      if (label !== "joy") {
        expect(joyWeight).toBeGreaterThanOrEqual(result[label]);
      }
    }
  });

  test("sadness centroid produces highest weight for sadness", () => {
    const sadCentroid = EMOTION_VAD_CENTROIDS.get("sadness")!;
    const result = vadToEmotionWeights(sadCentroid);
    const sadWeight = result.sadness;
    for (const label of EMOTION_LABELS) {
      if (label !== "sadness") {
        expect(sadWeight).toBeGreaterThanOrEqual(result[label]);
      }
    }
  });

  test("different VAD inputs produce different distributions", () => {
    const highV = vadToEmotionWeights({
      valence: 0.95,
      arousal: 0.5,
      dominance: 0.5,
    });
    const lowV = vadToEmotionWeights({
      valence: 0.05,
      arousal: 0.5,
      dominance: 0.5,
    });
    // High valence should give more weight to positive emotions
    expect(highV.joy).toBeGreaterThan(lowV.joy);
    expect(lowV.sadness).toBeGreaterThan(highV.sadness);
  });
});

// ── effectiveReactivity ──

describe("effectiveReactivity", () => {
  test("returns beta unchanged when the utterance is not neutral", () => {
    expect(effectiveReactivity(0.3, 0)).toBeCloseTo(0.3);
  });

  test("returns 0 when the utterance is fully neutral", () => {
    expect(effectiveReactivity(0.3, 1)).toBeCloseTo(0);
  });

  test("scales linearly with the neutral probability", () => {
    expect(effectiveReactivity(0.4, 0.25)).toBeCloseTo(0.3);
  });

  test("clamps the neutral probability to [0, 1]", () => {
    expect(effectiveReactivity(0.5, -2)).toBeCloseTo(0.5);
    expect(effectiveReactivity(0.5, 3)).toBeCloseTo(0);
  });
});

// ── combineEmotionAndMood ──

describe("combineEmotionAndMood", () => {
  const emotionDist = makeProbs({ joy: 0.8, excitement: 0.2 });
  const moodDist = makeProbs({ sadness: 0.6, grief: 0.4 });

  test("emotionWeight=1.0 returns emotion distribution", () => {
    const result = combineEmotionAndMood(emotionDist, moodDist, 1.0);
    expect(result.joy).toBeCloseTo(0.8);
    expect(result.excitement).toBeCloseTo(0.2);
    expect(result.sadness).toBeCloseTo(0.0);
  });

  test("emotionWeight=0.0 returns mood distribution", () => {
    const result = combineEmotionAndMood(emotionDist, moodDist, 0.0);
    expect(result.sadness).toBeCloseTo(0.6);
    expect(result.grief).toBeCloseTo(0.4);
    expect(result.joy).toBeCloseTo(0.0);
  });

  test("emotionWeight=0.5 blends equally", () => {
    const result = combineEmotionAndMood(emotionDist, moodDist, 0.5);
    // Before re-normalization: joy=0.4, excitement=0.1, sadness=0.3, grief=0.2 → sum=1.0
    expect(result.joy).toBeCloseTo(0.4);
    expect(result.excitement).toBeCloseTo(0.1);
    expect(result.sadness).toBeCloseTo(0.3);
    expect(result.grief).toBeCloseTo(0.2);
  });

  test("result always sums to 1.0", () => {
    const weights = [0.0, 0.25, 0.5, 0.75, 1.0];
    for (const w of weights) {
      const result = combineEmotionAndMood(emotionDist, moodDist, w);
      expect(sumValues(result)).toBeCloseTo(1.0);
    }
  });

  test("result has all 28 keys", () => {
    const result = combineEmotionAndMood(emotionDist, moodDist, 0.5);
    expect(Object.keys(result).length).toBe(28);
  });
});

// ── extractTopEmotions ──

describe("extractTopEmotions", () => {
  const probs = makeProbs({
    joy: 0.5,
    sadness: 0.2,
    anger: 0.15,
    fear: 0.1,
    surprise: 0.05,
  });

  test("returns 5 elements by default", () => {
    const result = extractTopEmotions(probs);
    expect(result.length).toBe(5);
  });

  test("returns n elements when specified", () => {
    expect(extractTopEmotions(probs, 3).length).toBe(3);
    expect(extractTopEmotions(probs, 1).length).toBe(1);
  });

  test("sorted descending by probability", () => {
    const result = extractTopEmotions(probs);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1]!.probability).toBeGreaterThanOrEqual(
        result[i]!.probability,
      );
    }
  });

  test("first element is the highest probability emotion", () => {
    const result = extractTopEmotions(probs);
    expect(result[0]!.name).toBe("joy");
    expect(result[0]!.probability).toBe(0.5);
  });

  test("each entry has name and probability", () => {
    const result = extractTopEmotions(probs);
    for (const entry of result) {
      expect(typeof entry.name).toBe("string");
      expect(typeof entry.probability).toBe("number");
      expect(EMOTION_LABELS).toContain(entry.name);
    }
  });

  test("n larger than 28 returns all 28", () => {
    const result = extractTopEmotions(probs, 100);
    expect(result.length).toBe(28);
  });

  test("all-zero probabilities returns 5 entries with probability 0", () => {
    const zeros = makeProbs({});
    const result = extractTopEmotions(zeros);
    expect(result.length).toBe(5);
    for (const entry of result) {
      expect(entry.probability).toBe(0);
    }
  });
});

// ── categoriesToVAD ──

describe("categoriesToVAD", () => {
  test("single emotion returns that emotion's centroid", () => {
    const probs = makeProbs({ joy: 1.0 });
    const joyCentroid = EMOTION_VAD_CENTROIDS.get("joy")!;
    const result = categoriesToVAD(probs);
    expect(result.valence).toBeCloseTo(joyCentroid.valence);
    expect(result.arousal).toBeCloseTo(joyCentroid.arousal);
    expect(result.dominance).toBeCloseTo(joyCentroid.dominance);
  });

  test("all-zero returns NEUTRAL_VAD", () => {
    const result = categoriesToVAD(makeProbs({}));
    expect(result.valence).toBeCloseTo(NEUTRAL_VAD.valence);
    expect(result.arousal).toBeCloseTo(NEUTRAL_VAD.arousal);
    expect(result.dominance).toBeCloseTo(NEUTRAL_VAD.dominance);
  });

  test("equal weights across all 28 gives mean of all centroids", () => {
    const equal = makeProbs(
      Object.fromEntries(EMOTION_LABELS.map((l) => [l, 1.0])),
    );
    const result = categoriesToVAD(equal);

    let vSum = 0;
    let aSum = 0;
    let dSum = 0;
    for (const [, c] of EMOTION_VAD_CENTROIDS) {
      vSum += c.valence;
      aSum += c.arousal;
      dSum += c.dominance;
    }
    expect(result.valence).toBeCloseTo(vSum / 28);
    expect(result.arousal).toBeCloseTo(aSum / 28);
    expect(result.dominance).toBeCloseTo(dSum / 28);
  });

  test("dominant emotion pulls result toward its centroid", () => {
    const probs = makeProbs({ sadness: 0.99, joy: 0.01 });
    const sadCentroid = EMOTION_VAD_CENTROIDS.get("sadness")!;
    const result = categoriesToVAD(probs);
    expect(result.valence).toBeCloseTo(sadCentroid.valence, 1);
    expect(result.arousal).toBeCloseTo(sadCentroid.arousal, 1);
  });

  test("result is always within [0, 1] for random inputs", () => {
    // Fixed seed via known values
    const emotions: EmotionLabel[] = [...EMOTION_LABELS];
    for (let i = 0; i < 20; i++) {
      const overrides: Partial<Record<EmotionLabel, number>> = {};
      for (const e of emotions) {
        overrides[e] = Math.abs(Math.sin(i * 27 + emotions.indexOf(e)));
      }
      const result = categoriesToVAD(makeProbs(overrides));
      expect(result.valence).toBeGreaterThanOrEqual(0.0);
      expect(result.valence).toBeLessThanOrEqual(1.0);
      expect(result.arousal).toBeGreaterThanOrEqual(0.0);
      expect(result.arousal).toBeLessThanOrEqual(1.0);
      expect(result.dominance).toBeGreaterThanOrEqual(0.0);
      expect(result.dominance).toBeLessThanOrEqual(1.0);
    }
  });

  test("two emotions equal weight gives their mean VAD", () => {
    const probs = makeProbs({ joy: 0.5, sadness: 0.5 });
    const joyCentroid = EMOTION_VAD_CENTROIDS.get("joy")!;
    const sadCentroid = EMOTION_VAD_CENTROIDS.get("sadness")!;
    const result = categoriesToVAD(probs);
    expect(result.valence).toBeCloseTo(
      (joyCentroid.valence + sadCentroid.valence) / 2,
    );
    expect(result.arousal).toBeCloseTo(
      (joyCentroid.arousal + sadCentroid.arousal) / 2,
    );
    expect(result.dominance).toBeCloseTo(
      (joyCentroid.dominance + sadCentroid.dominance) / 2,
    );
  });
});
