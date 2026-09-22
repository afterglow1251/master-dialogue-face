import { MAX_ACTIVATION, MIN_ACTIVATION } from "./constants.ts";

export function clamp01(value: number): number {
  return Math.min(MAX_ACTIVATION, Math.max(MIN_ACTIVATION, value));
}
