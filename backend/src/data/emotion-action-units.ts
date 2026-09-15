/**
 * Prototypical FACS Action Unit patterns for the 28 GoEmotions categories.
 *
 * Intensity is in [0, 1]: 1.0 marks a prototypical (obligatory) AU, values
 * below 1.0 mark variant AUs and carry the proportion of subjects that showed
 * them in the cited study, or an explicit extrapolation.
 *
 * Primary sources:
 *   - Ekman & Friesen, EMFACS / FACSAID emotion predictions
 *   - Du, Tao & Martinez (2014), PNAS 111(15), Table 1 — compound expressions
 *   - Keltner, Sauter, Tracy & Cowen (2019), J Nonverbal Behav 43, Table 2
 *   - Cordaro et al. (2018), Emotion 18(1) — ICP (international core patterns)
 *
 * Each entry carries a provenance note and one of:
 *   VERIFIED (AU set taken directly from a cited study of that emotion),
 *   REPRODUCED (cited study, secondary reproduction of the AU list),
 *   EXTRAPOLATED (nearest studied emotion, or an intensity judgement).
 */

import type { EmotionLabel } from "../types/index.ts";
import type { ActionUnit } from "./action-units.ts";

export interface EmotionActionUnit {
  readonly au: ActionUnit;
  readonly intensity: number;
}

export const EMOTION_ACTION_UNITS: ReadonlyMap<
  EmotionLabel,
  readonly EmotionActionUnit[]
> = new Map([
  // VERIFIED — EMFACS 6+12; Du 2014 "happy": prototypes 12, 25, variant 6 (51%).
  [
    "joy",
    [
      { au: 6, intensity: 1.0 },
      { au: 12, intensity: 1.0 },
      { au: 25, intensity: 0.5 },
    ],
  ],

  // VERIFIED — EMFACS 1+4+15; Du 2014 "sad": prototypes 4, 15, variants 1 (60%), 17 (67%).
  [
    "sadness",
    [
      { au: 1, intensity: 1.0 },
      { au: 4, intensity: 1.0 },
      { au: 15, intensity: 1.0 },
      { au: 17, intensity: 0.67 },
    ],
  ],

  // VERIFIED — EMFACS 4+5+7+23; Du 2014 "angry": prototypes 4, 7, 24, variant 17 (52%).
  [
    "anger",
    [
      { au: 4, intensity: 1.0 },
      { au: 7, intensity: 1.0 },
      { au: 24, intensity: 1.0 },
      { au: 5, intensity: 0.5 },
      { au: 23, intensity: 0.3 },
      { au: 17, intensity: 0.5 },
    ],
  ],

  // VERIFIED — EMFACS 1+2+4+5+20+26; Du 2014 "fearful": prototypes 1, 4, 20, 25,
  // variants 2 (57%), 5 (63%), 26 (33%).
  [
    "fear",
    [
      { au: 1, intensity: 1.0 },
      { au: 2, intensity: 0.6 },
      { au: 4, intensity: 1.0 },
      { au: 5, intensity: 0.6 },
      { au: 20, intensity: 1.0 },
      { au: 25, intensity: 1.0 },
      { au: 26, intensity: 0.35 },
    ],
  ],

  // VERIFIED — EMFACS 1+2+5+26; Du 2014 "surprised": prototypes 1, 2, 25, 26, variant 5 (66%).
  [
    "surprise",
    [
      { au: 1, intensity: 1.0 },
      { au: 2, intensity: 1.0 },
      { au: 5, intensity: 0.7 },
      { au: 25, intensity: 1.0 },
      { au: 26, intensity: 1.0 },
    ],
  ],

  // VERIFIED — EMFACS 9+15+16/17; Du 2014 "disgusted": prototypes 9, 10, 17,
  // variants 4 (31%), 24 (26%).
  [
    "disgust",
    [
      { au: 9, intensity: 1.0 },
      { au: 10, intensity: 1.0 },
      { au: 17, intensity: 1.0 },
      { au: 15, intensity: 0.5 },
      { au: 4, intensity: 0.3 },
    ],
  ],

  // VERIFIED — Keltner 2019 Table 2 "amusement": 6+7+12+25+26+53 (AU53 head up,
  // not representable); Cordaro 2018 ICP 6, 7, 12, 16, 25.
  [
    "amusement",
    [
      { au: 6, intensity: 1.0 },
      { au: 7, intensity: 0.6 },
      { au: 12, intensity: 1.0 },
      { au: 25, intensity: 0.8 },
      { au: 26, intensity: 0.5 },
    ],
  ],

  // VERIFIED — Keltner 2019 "embarrassment": 7+12+15+52+54+64, a dampened smile
  // with lip press; Keltner & Buswell 1997: 12, 24, 51, 54, 64.
  // Head-turn and gaze codes (51/52/54/64) are not representable in ARKit.
  [
    "embarrassment",
    [
      { au: 7, intensity: 0.6 },
      { au: 12, intensity: 0.6 },
      { au: 15, intensity: 0.4 },
      { au: 24, intensity: 0.5 },
    ],
  ],

  // VERIFIED — Tracy & Robins 2004: small smile plus 15° backward head tilt
  // (head pose not representable); Cordaro 2018 ICP 7, 12, 53.
  [
    "pride",
    [
      { au: 7, intensity: 0.4 },
      { au: 12, intensity: 0.5 },
    ],
  ],

  // VERIFIED — Keltner 2019 Table 2 "confusion": 4+7+56 (AU56 head tilt, not representable).
  [
    "confusion",
    [
      { au: 4, intensity: 1.0 },
      { au: 7, intensity: 0.8 },
    ],
  ],

  // EXTRAPOLATED label match — Keltner 2019 "interest": 1+2+12; curiosity is
  // mapped onto interest, which is the nearest studied display.
  [
    "curiosity",
    [
      { au: 1, intensity: 0.8 },
      { au: 2, intensity: 0.8 },
      { au: 12, intensity: 0.4 },
    ],
  ],

  // EXTRAPOLATED label match — Keltner 2019 "sympathy": 1+17+24+57 (AU57 head
  // forward, not representable); caring is mapped onto sympathy.
  [
    "caring",
    [
      { au: 1, intensity: 0.8 },
      { au: 17, intensity: 0.6 },
      { au: 24, intensity: 0.5 },
    ],
  ],

  // VERIFIED — Cordaro 2018 ICP "desire" 6, 7, 12, 25 (via Barrett 2019 and
  // Fugate & Franco 2021). The photo-set variant 19+25+26+43 is rejected as
  // an artifact of posed stimuli.
  [
    "desire",
    [
      { au: 6, intensity: 0.6 },
      { au: 7, intensity: 0.5 },
      { au: 12, intensity: 0.7 },
      { au: 25, intensity: 0.6 },
    ],
  ],

  // EXTRAPOLATED — from Cordaro 2018 ICP "awe": 1, 2, 5, 12, 25.
  [
    "admiration",
    [
      { au: 1, intensity: 0.8 },
      { au: 2, intensity: 0.8 },
      { au: 5, intensity: 0.5 },
      { au: 12, intensity: 0.7 },
      { au: 25, intensity: 0.4 },
    ],
  ],

  // EXTRAPOLATED label match — Du 2014 "happily surprised": prototypes 1, 2, 12, 25,
  // variants 5 (64%), 26 (67%).
  [
    "excitement",
    [
      { au: 1, intensity: 0.8 },
      { au: 2, intensity: 0.8 },
      { au: 12, intensity: 1.0 },
      { au: 25, intensity: 0.8 },
      { au: 5, intensity: 0.5 },
      { au: 26, intensity: 0.5 },
    ],
  ],

  // EXTRAPOLATED — Du 2014 "sad" prototypes plus its high-frequency variants,
  // read as intense sadness.
  [
    "grief",
    [
      { au: 1, intensity: 0.8 },
      { au: 4, intensity: 1.0 },
      { au: 15, intensity: 1.0 },
      { au: 6, intensity: 0.5 },
      { au: 17, intensity: 0.7 },
    ],
  ],

  // EXTRAPOLATED — Cordaro 2018 anger ICP 4, 7 held at low intensity.
  [
    "annoyance",
    [
      { au: 4, intensity: 0.8 },
      { au: 7, intensity: 0.7 },
    ],
  ],

  // EXTRAPOLATED — from Cordaro 2018 contempt ICP 4, 14, 25.
  [
    "disapproval",
    [
      { au: 4, intensity: 0.6 },
      { au: 14, intensity: 0.8 },
      { au: 25, intensity: 0.3 },
    ],
  ],

  // EXTRAPOLATED — from Cordaro 2018 sadness ICP 4, 43, 54 (AU54 head down, not
  // representable), plus a mild AU15.
  [
    "disappointment",
    [
      { au: 4, intensity: 0.6 },
      { au: 43, intensity: 0.4 },
      { au: 15, intensity: 0.4 },
    ],
  ],

  // EXTRAPOLATED — attenuated fear ICP 1, 2, 5, 7 without the jaw drop.
  [
    "nervousness",
    [
      { au: 1, intensity: 0.7 },
      { au: 2, intensity: 0.5 },
      { au: 4, intensity: 0.6 },
      { au: 5, intensity: 0.5 },
      { au: 20, intensity: 0.3 },
    ],
  ],

  // EXTRAPOLATED — from Cordaro 2018 shame ICP 4, 17, 54 (AU54 not representable);
  // Keltner 1996 treats guilt as close to shame.
  [
    "remorse",
    [
      { au: 4, intensity: 0.7 },
      { au: 17, intensity: 0.7 },
      { au: 15, intensity: 0.4 },
    ],
  ],

  // EXTRAPOLATED — contentment smile (AU12) plus the interest brow raise (AU1+2).
  [
    "optimism",
    [
      { au: 12, intensity: 0.6 },
      { au: 1, intensity: 0.4 },
      { au: 2, intensity: 0.4 },
    ],
  ],

  // EXTRAPOLATED — from Cordaro 2018 contentment ICP 12, 43.
  [
    "approval",
    [
      { au: 12, intensity: 0.6 },
      { au: 43, intensity: 0.3 },
    ],
  ],

  // EXTRAPOLATED — surprise brow and lid raise without the jaw drop.
  [
    "realization",
    [
      { au: 1, intensity: 0.7 },
      { au: 2, intensity: 0.7 },
      { au: 5, intensity: 0.5 },
    ],
  ],

  // EXTRAPOLATED — Duchenne smile (6+12). Keltner 2019 marks love as reliably
  // signalled by the face but publishes no AU set for it.
  [
    "love",
    [
      { au: 6, intensity: 0.8 },
      { au: 12, intensity: 0.8 },
    ],
  ],

  // EXTRAPOLATED, WEAK — Keltner 2019 Table 3 finds no facial display for
  // gratitude (signalled by touch). A minimal warm smile stands in as a placeholder.
  [
    "gratitude",
    [
      { au: 12, intensity: 0.4 },
      { au: 1, intensity: 0.3 },
    ],
  ],

  // EXTRAPOLATED, WEAK — Keltner 2019 finds no facial display for relief
  // (signalled vocally). Modelled as an exhale: soft smile, lids down, jaw loose.
  [
    "relief",
    [
      { au: 12, intensity: 0.4 },
      { au: 43, intensity: 0.4 },
      { au: 26, intensity: 0.2 },
    ],
  ],

  // VERIFIED — neutral is the absence of AU activity by definition.
  ["neutral", []],
]);
