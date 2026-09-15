import {
  ARKIT_BLENDSHAPES,
  type ArkitBlendshapeName,
} from "@shared/types/blendshape";
import type { SpeechAlignment } from "@shared/types/speech";

export type Viseme =
  | "sil"
  | "PP"
  | "FF"
  | "DD"
  | "nn"
  | "kk"
  | "CH"
  | "SS"
  | "RR"
  | "aa"
  | "E"
  | "I"
  | "O"
  | "U";

export type MouthShape = Partial<Record<ArkitBlendshapeName, number>>;

const VISEME_CHARACTERS: ReadonlyArray<readonly [Viseme, string]> = [
  ["sil", ".,!?;:…—–\n"],
  ["PP", "пбмpbm"],
  ["FF", "фвfv"],
  ["DD", "тдtd"],
  ["nn", "нлnl"],
  ["kk", "кгґхkgqxhc"],
  ["CH", "чшщжj"],
  ["SS", "сзцsz"],
  ["RR", "рr"],
  ["aa", "аяa"],
  ["E", "еєe"],
  ["I", "иіїйiy"],
  ["O", "оo"],
  ["U", "уюuw"],
];

const CHARACTER_VISEMES = new Map<string, Viseme>(
  VISEME_CHARACTERS.flatMap(([viseme, characters]) =>
    [...characters].map((character): [string, Viseme] => [character, viseme]),
  ),
);

const VISEME_SHAPES = new Map<Viseme, MouthShape>([
  ["sil", {}],
  [
    "PP",
    {
      mouthClose: 0.3,
      mouthPressLeft: 0.5,
      mouthPressRight: 0.5,
      mouthRollLower: 0.3,
      mouthRollUpper: 0.2,
    },
  ],
  [
    "FF",
    {
      jawOpen: 0.1,
      mouthRollLower: 0.6,
      mouthUpperUpLeft: 0.2,
      mouthUpperUpRight: 0.2,
    },
  ],
  ["DD", { jawOpen: 0.2, mouthStretchLeft: 0.15, mouthStretchRight: 0.15 }],
  ["nn", { jawOpen: 0.15, mouthStretchLeft: 0.1, mouthStretchRight: 0.1 }],
  ["kk", { jawOpen: 0.25, mouthStretchLeft: 0.1, mouthStretchRight: 0.1 }],
  ["CH", { jawOpen: 0.15, mouthFunnel: 0.45, mouthPucker: 0.25 }],
  ["SS", { jawOpen: 0.08, mouthStretchLeft: 0.3, mouthStretchRight: 0.3 }],
  ["RR", { jawOpen: 0.2, mouthFunnel: 0.25 }],
  ["aa", { jawOpen: 0.6, mouthLowerDownLeft: 0.25, mouthLowerDownRight: 0.25 }],
  ["E", { jawOpen: 0.35, mouthStretchLeft: 0.35, mouthStretchRight: 0.35 }],
  ["I", { jawOpen: 0.2, mouthStretchLeft: 0.45, mouthStretchRight: 0.45 }],
  ["O", { jawOpen: 0.4, mouthFunnel: 0.55 }],
  ["U", { jawOpen: 0.15, mouthFunnel: 0.3, mouthPucker: 0.6 }],
]);

export const MOUTH_BLENDSHAPES: ReadonlySet<ArkitBlendshapeName> = new Set(
  ARKIT_BLENDSHAPES.filter((name) =>
    [...VISEME_SHAPES.values()].some((shape) => shape[name] !== undefined),
  ),
);

export function characterToViseme(character: string): Viseme | null {
  return CHARACTER_VISEMES.get(character.toLowerCase()) ?? null;
}

function findCharacterIndex(
  startTimes: readonly number[],
  time: number,
): number {
  let low = 0;
  let high = startTimes.length - 1;
  let found = -1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const start = startTimes[middle] ?? Number.POSITIVE_INFINITY;
    if (start <= time) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return found;
}

export function visemeAt(
  alignment: SpeechAlignment,
  time: number,
): Viseme | null {
  const lastEnd = alignment.endTimes[alignment.endTimes.length - 1];
  if (lastEnd === undefined || time >= lastEnd) return null;

  for (
    let index = findCharacterIndex(alignment.startTimes, time);
    index >= 0;
    index--
  ) {
    const viseme = characterToViseme(alignment.characters[index] ?? "");
    if (viseme) return viseme;
  }

  return "sil";
}

export function mouthShapeAt(
  alignment: SpeechAlignment,
  time: number,
): MouthShape | null {
  const viseme = visemeAt(alignment, time);
  if (!viseme) return null;
  return VISEME_SHAPES.get(viseme) ?? {};
}

export function spokenTextAt(alignment: SpeechAlignment, time: number): string {
  const count = findCharacterIndex(alignment.startTimes, time) + 1;
  return alignment.characters.slice(0, count).join("");
}
