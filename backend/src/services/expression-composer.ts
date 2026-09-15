import {
  ANTAGONIST_PAIRS,
  AU_TO_BLENDSHAPES,
  gainOf,
  isArkitBlendshapeName,
  type ActionUnit,
} from "../data/action-units.ts";
import { EMOTION_ACTION_UNITS } from "../data/emotion-action-units.ts";
import {
  ARKIT_BLENDSHAPES,
  EMOTION_LABELS,
  createEmptyBlendshapeVector,
  type ArkitBlendshapeName,
  type BlendshapeVector,
  type EmotionLabel,
  type EmotionProbabilities,
  type EmotionScore,
} from "../types/index.ts";

const ABSOLUTE_GATE = 0.15;
const RELATIVE_GATE = 0.25;
const GAMMA = 1.5;
const SUPPRESSION_K = 0.8;
const ANTAGONIST_EPSILON = 1e-6;
const ASYMMETRY_AMPLITUDE = 0.12;
const NEUTRAL_LABEL: EmotionLabel = "neutral";

const MIN_ACTIVATION = 0;
const MAX_ACTIVATION = 1;
const FULL_CONFIDENCE = 1;
const DEFAULT_INTENSITY_MULTIPLIER = 1;
const SYMMETRIC_SEED = 0;

const LEFT_SUFFIX = "Left";
const RIGHT_SUFFIX = "Right";

const HASH_OFFSET_BASIS = 2166136261;
const HASH_PRIME = 16777619;
const HASH_RANGE = 4294967296;
const SEED_MIX = 374761393;

interface LateralPair {
  readonly feature: string;
  readonly left: ArkitBlendshapeName;
  readonly right: ArkitBlendshapeName;
}

const LATERAL_PAIRS: readonly LateralPair[] = ARKIT_BLENDSHAPES.flatMap(
  (name): readonly LateralPair[] => {
    if (!name.endsWith(LEFT_SUFFIX)) return [];
    const feature = name.slice(0, name.length - LEFT_SUFFIX.length);
    const right = `${feature}${RIGHT_SUFFIX}`;
    if (!isArkitBlendshapeName(right)) return [];
    return [{ feature, left: name, right }];
  },
);

function clampActivation(value: number): number {
  return Math.min(MAX_ACTIVATION, Math.max(MIN_ACTIVATION, value));
}

export function selectActiveEmotions(
  probabilities: EmotionProbabilities,
): readonly EmotionScore[] {
  const candidates: EmotionScore[] = [];
  let strongest = MIN_ACTIVATION;

  for (const label of EMOTION_LABELS) {
    if (label === NEUTRAL_LABEL) continue;
    const probability = probabilities[label];
    if (probability > strongest) strongest = probability;
    candidates.push({ name: label, probability });
  }

  const threshold = Math.max(ABSOLUTE_GATE, RELATIVE_GATE * strongest);

  return candidates
    .filter((candidate) => candidate.probability >= threshold)
    .sort((a, b) => b.probability - a.probability);
}

export function intensityCurve(
  probability: number,
  confidence = FULL_CONFIDENCE,
): number {
  const p = clampActivation(probability);
  const positive = Math.pow(p, GAMMA);
  const negative = Math.pow(MAX_ACTIVATION - p, GAMMA);
  const denominator = positive + negative;
  if (denominator === 0) return MIN_ACTIVATION;
  return (positive / denominator) * clampActivation(confidence);
}

export function aggregateActionUnits(
  active: readonly EmotionScore[],
  confidence = FULL_CONFIDENCE,
): ReadonlyMap<ActionUnit, number> {
  const result = new Map<ActionUnit, number>();

  for (const emotion of active) {
    const pattern = EMOTION_ACTION_UNITS.get(emotion.name);
    if (!pattern) continue;

    const strength = intensityCurve(emotion.probability, confidence);

    for (const entry of pattern) {
      const activation = strength * entry.intensity;
      const previous = result.get(entry.au) ?? MIN_ACTIVATION;
      if (activation > previous) result.set(entry.au, activation);
    }
  }

  return result;
}

export function resolveAntagonists(
  actionUnits: ReadonlyMap<ActionUnit, number>,
): ReadonlyMap<ActionUnit, number> {
  const result = new Map(actionUnits);

  for (const [first, second] of ANTAGONIST_PAIRS) {
    const firstValue = result.get(first) ?? MIN_ACTIVATION;
    const secondValue = result.get(second) ?? MIN_ACTIVATION;
    if (firstValue <= ANTAGONIST_EPSILON) continue;
    if (secondValue <= ANTAGONIST_EPSILON) continue;

    const strongerIsFirst = firstValue >= secondValue;
    const stronger = strongerIsFirst ? firstValue : secondValue;
    const weaker = strongerIsFirst ? secondValue : firstValue;
    const weakerUnit = strongerIsFirst ? second : first;

    const suppressed = weaker * (1 - SUPPRESSION_K * (stronger - weaker));
    result.set(weakerUnit, clampActivation(suppressed));
  }

  return result;
}

export function signedHash(seed: number, key: string): number {
  let hash = HASH_OFFSET_BASIS ^ Math.imul(seed, SEED_MIX);

  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, HASH_PRIME);
  }

  const unit = (hash >>> 0) / HASH_RANGE;
  return unit * 2 - 1;
}

// Asymmetry amplitude: ±12% of the activation, about one third of a typical
// 0.35 activation (Hauser et al. 2024). The sign is drawn per feature from a
// deterministic hash, so there is no fixed left-side bias (Ekman 1981).
export function toBlendshapes(
  actionUnits: ReadonlyMap<ActionUnit, number>,
  intensityMultiplier = DEFAULT_INTENSITY_MULTIPLIER,
  asymmetrySeed = SYMMETRIC_SEED,
): BlendshapeVector {
  const result = createEmptyBlendshapeVector();

  for (const [au, activation] of actionUnits) {
    if (activation <= MIN_ACTIVATION) continue;
    const targets = AU_TO_BLENDSHAPES.get(au);
    if (!targets) continue;

    const value = activation * gainOf(au) * intensityMultiplier;
    for (const target of targets) {
      if (value > result[target]) result[target] = value;
    }
  }

  if (asymmetrySeed !== SYMMETRIC_SEED) {
    for (const pair of LATERAL_PAIRS) {
      const offset =
        ASYMMETRY_AMPLITUDE * signedHash(asymmetrySeed, pair.feature);
      result[pair.left] *= 1 + offset;
      result[pair.right] *= 1 - offset;
    }
  }

  for (const name of ARKIT_BLENDSHAPES) {
    result[name] = clampActivation(result[name]);
  }

  return result;
}

export function composeExpression(
  probabilities: EmotionProbabilities,
  intensityMultiplier = DEFAULT_INTENSITY_MULTIPLIER,
  asymmetrySeed = SYMMETRIC_SEED,
): BlendshapeVector {
  const active = selectActiveEmotions(probabilities);
  const confidence = MAX_ACTIVATION - clampActivation(probabilities.neutral);
  const aggregated = aggregateActionUnits(active, confidence);
  const resolved = resolveAntagonists(aggregated);

  return toBlendshapes(resolved, intensityMultiplier, asymmetrySeed);
}

// Stable per-conversation seed: one dialogue always gets the same asymmetry.
export function asymmetrySeedFromId(id: string): number {
  let hash = HASH_OFFSET_BASIS;

  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, HASH_PRIME);
  }

  const seed = hash >>> 0;
  return seed === SYMMETRIC_SEED ? 1 : seed;
}
