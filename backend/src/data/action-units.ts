/**
 * FACS Action Units (Ekman & Friesen, Facial Action Coding System) and their
 * ARKit blendshape equivalents.
 *
 * AU → blendshape mapping source: Melinda Ozel, "ARKit to FACS cheat sheet"
 * (https://melindaozel.com/arkit-to-facs-cheat-sheet/).
 */

import { ARKIT_BLENDSHAPES, type ArkitBlendshapeName } from "../types/index.ts";

export const ACTION_UNITS = [
  1, 2, 4, 5, 6, 7, 9, 10, 12, 14, 15, 16, 17, 20, 23, 24, 25, 26, 43,
] as const;

export type ActionUnit = (typeof ACTION_UNITS)[number];

export type FaceRegion = "upper" | "lower";

export const FACE_REGIONS = {
  upper: [1, 2, 4, 5, 6, 7, 43],
  lower: [9, 10, 12, 14, 15, 16, 17, 20, 23, 24, 25, 26],
} as const satisfies Record<FaceRegion, readonly ActionUnit[]>;

const UPPER_FACE_ACTION_UNITS: ReadonlySet<ActionUnit> = new Set(
  FACE_REGIONS.upper,
);

export function regionOf(au: ActionUnit): FaceRegion {
  return UPPER_FACE_ACTION_UNITS.has(au) ? "upper" : "lower";
}

export const AU_TO_BLENDSHAPES: ReadonlyMap<
  ActionUnit,
  readonly ArkitBlendshapeName[]
> = new Map([
  [1, ["browInnerUp"]],
  [2, ["browOuterUpLeft", "browOuterUpRight"]],
  [4, ["browDownLeft", "browDownRight"]],
  [5, ["eyeWideLeft", "eyeWideRight"]],
  [6, ["cheekSquintLeft", "cheekSquintRight"]],
  [7, ["eyeSquintLeft", "eyeSquintRight"]],
  [9, ["noseSneerLeft", "noseSneerRight"]],
  [10, ["mouthUpperUpLeft", "mouthUpperUpRight"]],
  [12, ["mouthSmileLeft", "mouthSmileRight"]],
  [14, ["mouthDimpleLeft", "mouthDimpleRight"]],
  [15, ["mouthFrownLeft", "mouthFrownRight"]],
  [16, ["mouthLowerDownLeft", "mouthLowerDownRight"]],
  [17, ["mouthShrugLower"]],
  [20, ["mouthStretchLeft", "mouthStretchRight"]],
  [23, ["mouthPressLeft", "mouthPressRight"]],
  [24, ["mouthPressLeft", "mouthPressRight"]],
  // AU25 (lips part) has no dedicated ARKit shape: `mouthClose` is the inverse
  // of a jaw-driven viseme, so a low-gain `jawOpen` is used instead.
  // Pragmatic substitution, not part of the Ozel cheat sheet.
  [25, ["jawOpen"]],
  [26, ["jawOpen"]],
  [43, ["eyeBlinkLeft", "eyeBlinkRight"]],
]);

const DEFAULT_AU_GAIN = 1;
const LIPS_PART_GAIN = 0.25;
const EYES_CLOSED_GAIN = 0.5;

/** Per-AU scaling applied when an AU drives its blendshapes. Default is 1. */
export const AU_GAINS: ReadonlyMap<ActionUnit, number> = new Map([
  [25, LIPS_PART_GAIN],
  // AU43 is a sustained lid closure, rendered as partial closure so the avatar
  // does not read as fully blinking while an expression is held.
  [43, EYES_CLOSED_GAIN],
]);

export function gainOf(au: ActionUnit): number {
  return AU_GAINS.get(au) ?? DEFAULT_AU_GAIN;
}

/**
 * Opposing AU pairs (FACS manual: antagonistic muscle groups that cannot be
 * fully co-activated). The 6↔9 pair is empirical and weaker than the rest.
 */
export const ANTAGONIST_PAIRS: readonly (readonly [ActionUnit, ActionUnit])[] =
  [
    [12, 15],
    [1, 4],
    [2, 4],
    [5, 7],
    [5, 43],
    [26, 24],
    [25, 24],
    [6, 9],
  ];

const BLENDSHAPE_NAMES: ReadonlySet<string> = new Set(ARKIT_BLENDSHAPES);

export function isArkitBlendshapeName(
  value: string,
): value is ArkitBlendshapeName {
  return BLENDSHAPE_NAMES.has(value);
}
