/**
 * Frame-rate independent Exponential Moving Average for blendshape transitions.
 *
 * Formula: B_j(t) = alpha * B_j_target + (1 - alpha) * B_j(t-1)
 * with a per-frame alpha = 1 - exp(-dt / tau), so the perceived smoothing
 * speed stays the same whether the display runs at 60, 90 or 120 Hz.
 *
 * Slider values are authored as a per-frame alpha at 60 Hz and converted to a
 * time constant tau via alphaToTau.
 */

const REFERENCE_FRAME_SECONDS = 1 / 60;
const MAX_FRAME_SECONDS = 0.1;

export function alphaToTau(referenceAlpha: number): number {
  if (referenceAlpha >= 1) return 0;
  if (referenceAlpha <= 0) return Number.POSITIVE_INFINITY;
  return -REFERENCE_FRAME_SECONDS / Math.log(1 - referenceAlpha);
}

export function frameAlpha(tau: number, deltaSeconds: number): number {
  if (tau <= 0) return 1;
  const clamped = Math.min(Math.max(deltaSeconds, 0), MAX_FRAME_SECONDS);
  return 1 - Math.exp(-clamped / tau);
}

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
