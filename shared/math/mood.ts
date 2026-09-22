import { EMOTION_VAD_CENTROIDS } from "../tables/emotion-vad.ts";
import {
  EMOTION_LABELS,
  NEUTRAL_VAD,
  createEmptyProbabilities,
  type EmotionLabel,
  type EmotionProbabilities,
  type EmotionScore,
  type VADValues,
} from "../types/index.ts";
import { clamp01 } from "./clamp.ts";
import { DEFAULT_TOP_EMOTIONS, KERNEL_SIGMA } from "./constants.ts";

/**
 * Formula 8 — exponential mood decay.
 *
 *   d(Δt) = e^(−Δt / τ)
 *
 *   Δt — seconds since the previous turn
 *   τ  — decay time constant, user-configurable
 *
 * ──
 *
 * Формула 8 — експоненційне загасання настрою.
 *
 *   Δt — секунд від попереднього ходу
 *   τ  — стала часу загасання, налаштовується користувачем
 */
export function computeDecay(deltaSeconds: number, tauSeconds: number): number {
  if (tauSeconds <= 0) return 0;
  return Math.exp(-deltaSeconds / tauSeconds);
}

/**
 * Formula 9 — adaptive reactivity.
 *
 *   β_eff = β · (1 − p_neutral)
 *
 *   β — configured mood reactivity
 *   p_neutral — probability that the utterance is neutral
 *
 * ──
 *
 * Формула 9 — адаптивна реактивність.
 *
 *   β — задана реактивність настрою
 *   p_neutral — ймовірність того, що висловлювання нейтральне
 *
 *   Нейтральне висловлювання зсуває настрій менше, ніж емоційне.
 */
export function effectiveReactivity(
  beta: number,
  neutralProbability: number,
): number {
  return beta * (1 - clamp01(neutralProbability));
}

/**
 * Formula 10 — mood update (ALMA).
 *
 *   M(t) = β_eff · E(t) + (1 − β_eff) · [ N + (M(t−1) − N) · d(Δt) ]
 *
 *   N    — neutral VAD origin
 *   E(t) — VAD of the current utterance
 *   d    — decay factor (formula 8)
 *
 *   Applied to each of V, A and D independently; every component is then
 *   clamped to [0, 1].
 *
 * ──
 *
 * Формула 10 — оновлення настрою (ALMA).
 *
 *   N    — нейтральний початок у просторі VAD
 *   E(t) — VAD поточного висловлювання
 *   d    — коефіцієнт загасання (формула 8)
 *
 *   Застосовується до валентності, збудження й домінування незалежно; кожна
 *   складова потім обрізається до [0, 1].
 */
export function updateMoodVAD(params: {
  readonly previousMood: VADValues;
  readonly currentEmotionVAD: VADValues;
  readonly deltaSeconds: number;
  readonly beta: number;
  readonly tau: number;
}): VADValues {
  const { previousMood, currentEmotionVAD, deltaSeconds, beta, tau } = params;
  const decay = computeDecay(deltaSeconds, tau);

  function blend(dim: keyof VADValues, neutral: number): number {
    const decayed = neutral + (previousMood[dim] - neutral) * decay;
    return clamp01(beta * currentEmotionVAD[dim] + (1 - beta) * decayed);
  }

  return {
    valence: blend("valence", NEUTRAL_VAD.valence),
    arousal: blend("arousal", NEUTRAL_VAD.arousal),
    dominance: blend("dominance", NEUTRAL_VAD.dominance),
  };
}

/**
 * Formula 11 — VAD → categories, inverse-distance kernel.
 *
 *   dᵢ² = (V − Vᵢ)² + (A − Aᵢ)² + (D − Dᵢ)²
 *
 *                 1
 *   wᵢ = ─────────────────,     ŵᵢ = wᵢ / Σⱼ wⱼ
 *            dᵢ² + σ²
 *
 *   (V, A, D)    — current mood point
 *   (Vᵢ, Aᵢ, Dᵢ) — VAD centroid of emotion i
 *   dᵢ           — Euclidean distance between them
 *   σ            — kernel bound, keeps wᵢ finite when dᵢ = 0
 *
 * ──
 *
 * Формула 11 — перехід від VAD до категорій, ядро оберненої відстані.
 *
 *   (V, A, D)    — поточна точка настрою
 *   (Vᵢ, Aᵢ, Dᵢ) — центроїд VAD емоції i
 *   dᵢ           — евклідова відстань між ними
 *   σ            — межа ядра: без неї настрій, що влучив точно в центроїд,
 *                  дав би ділення на нуль
 */
export function vadToEmotionWeights(moodVAD: VADValues): EmotionProbabilities {
  const weights = new Map<EmotionLabel, number>();
  let weightSum = 0;

  for (const [emotion, centroid] of EMOTION_VAD_CENTROIDS) {
    const dv = moodVAD.valence - centroid.valence;
    const da = moodVAD.arousal - centroid.arousal;
    const dd = moodVAD.dominance - centroid.dominance;
    const squaredDistance = dv * dv + da * da + dd * dd;
    const w = 1 / (squaredDistance + KERNEL_SIGMA * KERNEL_SIGMA);
    weights.set(emotion, w);
    weightSum += w;
  }

  const result = createEmptyProbabilities();
  for (const label of EMOTION_LABELS) {
    result[label] = (weights.get(label) ?? 0) / weightSum;
  }

  return result;
}

/**
 * Formula 12 — emotion and mood combination.
 *
 *   S(t) = w_e · E_cat(t) + (1 − w_e) · M_cat(t),   renormalized to Σᵢ Sᵢ = 1
 *
 *   E_cat — per-utterance emotion distribution
 *   M_cat — mood distribution (formula 11)
 *   w_e   — emotion weight, user-configurable
 *
 *   The renormalization is skipped when the sum is zero; the result is then
 *   all zeros rather than a division by zero.
 *
 * ──
 *
 * Формула 12 — поєднання емоції та настрою.
 *
 *   E_cat — розподіл емоцій поточного висловлювання
 *   M_cat — розподіл настрою (формула 11)
 *   w_e   — вага емоції, налаштовується користувачем
 *
 *   Нормалізація пропускається, коли сума нульова: результат тоді нульовий,
 *   а не ділення на нуль.
 */
export function combineEmotionAndMood(
  emotionCategories: EmotionProbabilities,
  moodCategories: EmotionProbabilities,
  emotionWeight: number,
): EmotionProbabilities {
  const moodWeight = 1 - emotionWeight;
  const result = createEmptyProbabilities();
  let sum = 0;

  for (const label of EMOTION_LABELS) {
    const v =
      emotionWeight * emotionCategories[label] +
      moodWeight * moodCategories[label];
    result[label] = v;
    sum += v;
  }

  if (sum > 0) {
    for (const label of EMOTION_LABELS) {
      result[label] /= sum;
    }
  }

  return result;
}

/**
 * Formula 13 — categories → VAD.
 *
 *         Σᵢ pᵢ · Cᵢ
 *   V = ──────────────
 *           Σᵢ pᵢ
 *
 *   Cᵢ — VAD centroid of emotion i
 *
 * ──
 *
 * Формула 13 — перехід від категорій до VAD.
 *
 *   Cᵢ — центроїд VAD емоції i
 */
export function categoriesToVAD(
  probabilities: EmotionProbabilities,
): VADValues {
  let vSum = 0;
  let aSum = 0;
  let dSum = 0;
  let wSum = 0;

  for (const [emotion, centroid] of EMOTION_VAD_CENTROIDS) {
    const p = probabilities[emotion];
    vSum += p * centroid.valence;
    aSum += p * centroid.arousal;
    dSum += p * centroid.dominance;
    wSum += p;
  }

  if (wSum === 0) return { ...NEUTRAL_VAD };

  return {
    valence: vSum / wSum,
    arousal: aSum / wSum,
    dominance: dSum / wSum,
  };
}

export function extractTopEmotions(
  probabilities: EmotionProbabilities,
  n = DEFAULT_TOP_EMOTIONS,
): readonly EmotionScore[] {
  return EMOTION_LABELS.map(
    (name): EmotionScore => ({
      name,
      probability: probabilities[name],
    }),
  )
    .sort((a, b) => b.probability - a.probability)
    .slice(0, n);
}
