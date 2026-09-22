export { clamp01 } from "./clamp.ts";

export {
  ABSOLUTE_GATE,
  ANTAGONIST_EPSILON,
  ASYMMETRY_AMPLITUDE,
  DEFAULT_INTENSITY_MULTIPLIER,
  DEFAULT_TOP_EMOTIONS,
  FULL_CONFIDENCE,
  GAMMA,
  KERNEL_SIGMA,
  MAX_ACTIVATION,
  MAX_FRAME_SECONDS,
  MIN_ACTIVATION,
  REFERENCE_FRAME_SECONDS,
  RELATIVE_GATE,
  SUPPRESSION_K,
  SYMMETRIC_SEED,
} from "./constants.ts";

export { normalizeProbabilities } from "./normalization.ts";

export { alphaToTau, applyEMA, frameAlpha } from "./smoothing.ts";

export {
  categoriesToVAD,
  combineEmotionAndMood,
  computeDecay,
  effectiveReactivity,
  extractTopEmotions,
  updateMoodVAD,
  vadToEmotionWeights,
} from "./mood.ts";

export {
  aggregateActionUnits,
  asymmetrySeedFromId,
  composeExpression,
  intensityCurve,
  resolveAntagonists,
  selectActiveEmotions,
  signedHash,
  toBlendshapes,
} from "./activation.ts";

export { mixBlendshapeTemplates } from "./blendshape.ts";
