import {
  ANTAGONIST_PAIRS,
  AU_TO_BLENDSHAPES,
  gainOf,
  type ActionUnit,
} from "../tables/au-blendshape.ts";
import { EMOTION_ACTION_UNITS } from "../tables/emotion-au.ts";
import {
  ARKIT_BLENDSHAPES,
  EMOTION_LABELS,
  createEmptyBlendshapeVector,
  isArkitBlendshapeName,
  type ArkitBlendshapeName,
  type BlendshapeVector,
  type EmotionLabel,
  type EmotionProbabilities,
  type EmotionScore,
} from "../types/index.ts";
import { clamp01 } from "./clamp.ts";
import {
  ABSOLUTE_GATE,
  ANTAGONIST_EPSILON,
  ASYMMETRY_AMPLITUDE,
  DEFAULT_INTENSITY_MULTIPLIER,
  FULL_CONFIDENCE,
  GAMMA,
  MAX_ACTIVATION,
  MIN_ACTIVATION,
  RELATIVE_GATE,
  SUPPRESSION_K,
  SYMMETRIC_SEED,
} from "./constants.ts";

const NEUTRAL_LABEL: EmotionLabel = "neutral";

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

/**
 * Formula 3 — emotion gating.
 *
 *   θ = max( θ_abs , θ_rel · max p )   where max p is taken over i ≠ neutral
 *   A = { i ≠ neutral : pᵢ ≥ θ }
 *
 *   neutral is excluded from BOTH the maximum and the resulting set
 *
 * ──
 *
 * Формула 3 — відбір активних емоцій за порогом.
 *
 *   θ — поріг: більший з абсолютного та відносного
 *   A — множина активних емоцій
 *
 *   Нейтральну емоцію виключено І з максимуму, І з результуючої множини.
 */
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

/**
 * Formula 4 — intensity curve.
 *
 *                     p^γ
 *   f(p, c) = ─────────────────── · c
 *               p^γ + (1 − p)^γ
 *
 *   p — emotion probability, clamped to [0, 1] before use
 *   c — confidence, c = 1 − p_neutral, also clamped to [0, 1]
 *
 * ──
 *
 * Формула 4 — крива інтенсивності.
 *
 *   p — ймовірність емоції, обрізається до [0, 1] перед використанням
 *   c — впевненість, c = 1 − p_neutral, теж обрізається до [0, 1]
 */
export function intensityCurve(
  probability: number,
  confidence = FULL_CONFIDENCE,
): number {
  const p = clamp01(probability);
  const positive = Math.pow(p, GAMMA);
  const negative = Math.pow(MAX_ACTIVATION - p, GAMMA);
  const denominator = positive + negative;
  if (denominator === 0) return MIN_ACTIVATION;
  return (positive / denominator) * clamp01(confidence);
}

/**
 * Formula 5 — action unit aggregation.
 *
 *   a_u = max ( f(pᵢ, c) · I_iu ),   over every active emotion i
 *
 *   I_iu — prototypical intensity of AU u for emotion i
 *   a_u  — resulting activation of AU u
 *
 * ──
 *
 * Формула 5 — агрегація одиниць дії.
 *
 *   I_iu — прототипна інтенсивність одиниці дії u для емоції i
 *   a_u  — підсумкова активація одиниці дії u
 *
 *   Береться максимум, а не сума: дві емоції, що просять той самий м'яз,
 *   не скорочують його двічі.
 */
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

/**
 * Formula 6 — antagonist resolution.
 *
 *   a_w ← clamp₀₁( a_w · (1 − k · (a_s − a_w)) )
 *
 *   a_s — stronger unit of the pair, a_w — weaker
 *   k   — suppression strength
 *
 *   A pair is skipped when either unit is at or below ε, so a unit that is
 *   not active at all is never suppressed. Pairs are resolved in table order
 *   and each sees the values left by the previous ones.
 *
 * ──
 *
 * Формула 6 — розв'язання антагоністів.
 *
 *   a_s — сильніша одиниця пари, a_w — слабша
 *   k   — сила пригнічення
 *
 *   Пара пропускається, якщо хоч одна одиниця не перевищує ε, тож неактивна
 *   одиниця ніколи не пригнічується. Пари обробляються в порядку таблиці, і
 *   кожна бачить значення, залишені попередніми.
 */
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
    result.set(weakerUnit, clamp01(suppressed));
  }

  return result;
}

/**
 * Deterministic sign h ∈ [−1, 1) used by formula 7 (FNV-1a over the feature
 * name, mixed with the dialogue seed).
 *
 * ──
 *
 * Детермінований знак h ∈ [−1, 1) для формули 7: FNV-1a за назвою ознаки,
 * змішаний із зерном діалогу.
 */
export function signedHash(seed: number, key: string): number {
  let hash = HASH_OFFSET_BASIS ^ Math.imul(seed, SEED_MIX);

  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, HASH_PRIME);
  }

  const unit = (hash >>> 0) / HASH_RANGE;
  return unit * 2 - 1;
}

/**
 * Formula 7 — AU → blendshape projection with asymmetry.
 *
 *   Bⱼ = clamp₀₁( max (a_u · g_u · m) ),   over every AU u that drives Bⱼ
 *
 *   B_left  ← B_left  · (1 + 𝒜 · h)
 *   B_right ← B_right · (1 − 𝒜 · h)
 *
 *   a_u — activation of AU u       g_u — per-AU gain
 *   m   — expression intensity     𝒜   — asymmetry amplitude
 *   h   — deterministic sign in [−1, 1), see signedHash()
 *
 * ──
 *
 * Формула 7 — проєкція одиниць дії на параметри blendshape з асиметрією.
 *
 *   a_u — активація одиниці дії u   g_u — підсилення цієї одиниці
 *   m   — інтенсивність виразу      𝒜   — амплітуда асиметрії
 *   h   — детермінований знак у [−1, 1), див. signedHash()
 */
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
    result[name] = clamp01(result[name]);
  }

  return result;
}

/**
 * Full FACS pipeline: formulas 3 → 4 → 5 → 6 → 7.
 *
 * ──
 *
 * Повний конвеєр FACS: формули 3 → 4 → 5 → 6 → 7.
 */
export function composeExpression(
  probabilities: EmotionProbabilities,
  intensityMultiplier = DEFAULT_INTENSITY_MULTIPLIER,
  asymmetrySeed = SYMMETRIC_SEED,
): BlendshapeVector {
  const active = selectActiveEmotions(probabilities);
  const confidence = MAX_ACTIVATION - clamp01(probabilities.neutral);
  const aggregated = aggregateActionUnits(active, confidence);
  const resolved = resolveAntagonists(aggregated);

  return toBlendshapes(resolved, intensityMultiplier, asymmetrySeed);
}

/**
 * Stable per-dialogue asymmetry seed (FNV-1a over the dialogue id), so one
 * conversation always shows the same facial asymmetry.
 *
 * ──
 *
 * Стале зерно асиметрії для діалогу (FNV-1a за ідентифікатором), щоб у межах
 * однієї розмови асиметрія обличчя не змінювалась.
 */
export function asymmetrySeedFromId(id: string): number {
  let hash = HASH_OFFSET_BASIS;

  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, HASH_PRIME);
  }

  const seed = hash >>> 0;
  return seed === SYMMETRIC_SEED ? 1 : seed;
}
