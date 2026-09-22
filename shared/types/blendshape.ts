import { zeroed } from "./zeroed.ts";

export const ARKIT_BLENDSHAPES = [
  "browDownLeft",
  "browDownRight",
  "browInnerUp",
  "browOuterUpLeft",
  "browOuterUpRight",
  "cheekPuff",
  "cheekSquintLeft",
  "cheekSquintRight",
  "eyeBlinkLeft",
  "eyeBlinkRight",
  "eyeLookDownLeft",
  "eyeLookDownRight",
  "eyeLookInLeft",
  "eyeLookInRight",
  "eyeLookOutLeft",
  "eyeLookOutRight",
  "eyeLookUpLeft",
  "eyeLookUpRight",
  "eyeSquintLeft",
  "eyeSquintRight",
  "eyeWideLeft",
  "eyeWideRight",
  "jawForward",
  "jawLeft",
  "jawOpen",
  "jawRight",
  "mouthClose",
  "mouthDimpleLeft",
  "mouthDimpleRight",
  "mouthFrownLeft",
  "mouthFrownRight",
  "mouthFunnel",
  "mouthLeft",
  "mouthLowerDownLeft",
  "mouthLowerDownRight",
  "mouthPressLeft",
  "mouthPressRight",
  "mouthPucker",
  "mouthRight",
  "mouthRollLower",
  "mouthRollUpper",
  "mouthShrugLower",
  "mouthShrugUpper",
  "mouthSmileLeft",
  "mouthSmileRight",
  "mouthStretchLeft",
  "mouthStretchRight",
  "mouthUpperUpLeft",
  "mouthUpperUpRight",
  "noseSneerLeft",
  "noseSneerRight",
  "tongueOut",
] as const;

export type ArkitBlendshapeName = (typeof ARKIT_BLENDSHAPES)[number];

export type BlendshapeVector = Record<ArkitBlendshapeName, number>;

export function createEmptyBlendshapeVector(): BlendshapeVector {
  return zeroed(ARKIT_BLENDSHAPES);
}

const BLENDSHAPE_NAMES: ReadonlySet<string> = new Set(ARKIT_BLENDSHAPES);

export function isArkitBlendshapeName(
  value: string,
): value is ArkitBlendshapeName {
  return BLENDSHAPE_NAMES.has(value);
}

export const EXPRESSION_MODES = ["linear", "facs"] as const;

export type ExpressionMode = (typeof EXPRESSION_MODES)[number];

const EXPRESSION_MODE_NAMES: ReadonlySet<string> = new Set(EXPRESSION_MODES);

export function isExpressionMode(value: unknown): value is ExpressionMode {
  return typeof value === "string" && EXPRESSION_MODE_NAMES.has(value);
}

export type BlendshapesByMode = Readonly<
  Record<ExpressionMode, BlendshapeVector>
>;
