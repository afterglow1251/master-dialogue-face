/**
 * Exponential Moving Average for smooth blendshape transitions.
 *
 * Formula: B_j(t) = alpha * B_j_target + (1 - alpha) * B_j(t-1)
 *
 * alpha = 1.0 → instant transition
 * alpha = 0.1 → very slow transition
 * alpha = 0.3 → recommended default
 *
 * Runs every frame (60fps) in requestAnimationFrame.
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
