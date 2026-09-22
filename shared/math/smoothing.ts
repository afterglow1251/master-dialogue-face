import { MAX_FRAME_SECONDS, REFERENCE_FRAME_SECONDS } from "./constants.ts";

/**
 * Formula 14a — per-frame α authored at 60 Hz → time constant τ.
 *
 *            −Δt₆₀
 *   τ = ───────────────
 *         ln(1 − α₆₀)
 *
 *   α₆₀  — smoothing factor the user sets, defined per frame at 60 Hz
 *   Δt₆₀ — one frame at 60 Hz, 1/60 s
 *
 * ──
 *
 * Формула 14a — перехід від покадрової α при 60 Гц до сталої часу τ.
 *
 *   α₆₀  — коефіцієнт згладжування, який задає користувач; визначений
 *          на один кадр при 60 Гц
 *   Δt₆₀ — один кадр при 60 Гц, 1/60 с
 */
export function alphaToTau(referenceAlpha: number): number {
  if (referenceAlpha >= 1) return 0;
  if (referenceAlpha <= 0) return Number.POSITIVE_INFINITY;
  return -REFERENCE_FRAME_SECONDS / Math.log(1 - referenceAlpha);
}

/**
 * Formula 14b — frame-rate independent α.
 *
 *   α(Δt) = 1 − e^(−Δt / τ)
 *
 *   Δt — real time since the previous rendered frame
 *
 * ──
 *
 * Формула 14b — α, незалежна від частоти кадрів.
 *
 *   Δt — реальний час від попереднього відмальованого кадру
 *
 *   Завдяки цьому швидкість згладжування на вигляд однакова і при 60,
 *   і при 120 Гц.
 */
export function frameAlpha(tau: number, deltaSeconds: number): number {
  if (tau <= 0) return 1;
  const clamped = Math.min(Math.max(deltaSeconds, 0), MAX_FRAME_SECONDS);
  return 1 - Math.exp(-clamped / tau);
}

/**
 * Formula 14c — exponential moving average.
 *
 *   B(t) = α · B_target + (1 − α) · B(t−1)
 *
 * ──
 *
 * Формула 14c — експоненційне ковзне середнє.
 */
export function applyEMA(
  current: Record<string, number>,
  target: Record<string, number>,
  alpha: number | ((key: string) => number),
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const key of Object.keys(target)) {
    const currentVal = current[key] ?? 0;
    const targetVal = target[key] ?? 0;
    const keyAlpha = typeof alpha === "number" ? alpha : alpha(key);
    result[key] = keyAlpha * targetVal + (1 - keyAlpha) * currentVal;
  }

  return result;
}
