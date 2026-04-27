import { db } from "./index.ts";
import { characters, emotionTemplates } from "./schema.ts";
import { createEmptyBlendshapeVector } from "@shared/types/blendshape.ts";
import type { BlendshapeVector } from "@shared/types/blendshape.ts";

function template(overrides: Partial<BlendshapeVector>): BlendshapeVector {
  return { ...createEmptyBlendshapeVector(), ...overrides };
}

const EMOTION_TEMPLATE_DATA = [
  {
    emotionName: "admiration",
    description: "Warm appreciation, respect",
    blendshapeVector: template({
      mouthSmileLeft: 0.4,
      mouthSmileRight: 0.4,
      browInnerUp: 0.35,
      browOuterUpLeft: 0.2,
      browOuterUpRight: 0.2,
      eyeSquintLeft: 0.15,
      eyeSquintRight: 0.15,
    }),
  },
  {
    emotionName: "amusement",
    description: "Finding something funny, entertained",
    blendshapeVector: template({
      mouthSmileLeft: 0.75,
      mouthSmileRight: 0.75,
      cheekSquintLeft: 0.5,
      cheekSquintRight: 0.5,
      eyeSquintLeft: 0.4,
      eyeSquintRight: 0.4,
      jawOpen: 0.15,
      mouthDimpleLeft: 0.3,
      mouthDimpleRight: 0.3,
    }),
  },
  {
    emotionName: "anger",
    description: "Strong displeasure, hostility",
    blendshapeVector: template({
      browDownLeft: 0.8,
      browDownRight: 0.8,
      eyeSquintLeft: 0.5,
      eyeSquintRight: 0.5,
      noseSneerLeft: 0.6,
      noseSneerRight: 0.6,
      mouthFrownLeft: 0.4,
      mouthFrownRight: 0.4,
      jawForward: 0.3,
      mouthPressLeft: 0.5,
      mouthPressRight: 0.5,
    }),
  },
  {
    emotionName: "annoyance",
    description: "Mild irritation, displeasure",
    blendshapeVector: template({
      browDownLeft: 0.5,
      browDownRight: 0.5,
      noseSneerLeft: 0.3,
      noseSneerRight: 0.3,
      mouthFrownLeft: 0.3,
      mouthFrownRight: 0.3,
      eyeSquintLeft: 0.25,
      eyeSquintRight: 0.25,
      mouthPressLeft: 0.3,
      mouthPressRight: 0.3,
    }),
  },
  {
    emotionName: "approval",
    description: "Agreement, positive assessment",
    blendshapeVector: template({
      mouthSmileLeft: 0.3,
      mouthSmileRight: 0.3,
      browInnerUp: 0.15,
      cheekSquintLeft: 0.15,
      cheekSquintRight: 0.15,
    }),
  },
  {
    emotionName: "caring",
    description: "Warmth, concern for others",
    blendshapeVector: template({
      mouthSmileLeft: 0.3,
      mouthSmileRight: 0.3,
      browInnerUp: 0.3,
      eyeSquintLeft: 0.2,
      eyeSquintRight: 0.2,
      mouthPucker: 0.1,
    }),
  },
  {
    emotionName: "confusion",
    description: "Uncertainty, puzzlement",
    blendshapeVector: template({
      browInnerUp: 0.5,
      browDownLeft: 0.3,
      eyeSquintLeft: 0.2,
      mouthFrownLeft: 0.15,
      mouthFrownRight: 0.15,
      mouthPucker: 0.2,
    }),
  },
  {
    emotionName: "curiosity",
    description: "Desire to learn, interest",
    blendshapeVector: template({
      browInnerUp: 0.45,
      browOuterUpLeft: 0.35,
      browOuterUpRight: 0.35,
      eyeWideLeft: 0.3,
      eyeWideRight: 0.3,
      mouthSmileLeft: 0.1,
      mouthSmileRight: 0.1,
    }),
  },
  {
    emotionName: "desire",
    description: "Wanting, longing",
    blendshapeVector: template({
      eyeSquintLeft: 0.2,
      eyeSquintRight: 0.2,
      mouthSmileLeft: 0.2,
      mouthSmileRight: 0.2,
      mouthPucker: 0.25,
      browInnerUp: 0.2,
    }),
  },
  {
    emotionName: "disappointment",
    description: "Sadness from unmet expectations",
    blendshapeVector: template({
      mouthFrownLeft: 0.5,
      mouthFrownRight: 0.5,
      browInnerUp: 0.4,
      browDownLeft: 0.2,
      browDownRight: 0.2,
      eyeSquintLeft: 0.15,
      eyeSquintRight: 0.15,
      mouthPressLeft: 0.2,
      mouthPressRight: 0.2,
    }),
  },
  {
    emotionName: "disapproval",
    description: "Negative judgment, objection",
    blendshapeVector: template({
      browDownLeft: 0.45,
      browDownRight: 0.45,
      mouthFrownLeft: 0.4,
      mouthFrownRight: 0.4,
      noseSneerLeft: 0.2,
      noseSneerRight: 0.2,
      mouthPressLeft: 0.35,
      mouthPressRight: 0.35,
    }),
  },
  {
    emotionName: "disgust",
    description: "Strong aversion, revulsion",
    blendshapeVector: template({
      noseSneerLeft: 0.8,
      noseSneerRight: 0.8,
      browDownLeft: 0.5,
      browDownRight: 0.5,
      mouthUpperUpLeft: 0.6,
      mouthUpperUpRight: 0.6,
      cheekSquintLeft: 0.3,
      cheekSquintRight: 0.3,
      mouthFrownLeft: 0.4,
      mouthFrownRight: 0.4,
    }),
  },
  {
    emotionName: "embarrassment",
    description: "Self-conscious discomfort",
    blendshapeVector: template({
      cheekPuff: 0.2,
      mouthPressLeft: 0.4,
      mouthPressRight: 0.4,
      eyeLookDownLeft: 0.5,
      eyeLookDownRight: 0.5,
      mouthSmileLeft: 0.15,
      mouthSmileRight: 0.15,
      browInnerUp: 0.3,
    }),
  },
  {
    emotionName: "excitement",
    description: "Enthusiastic eagerness",
    blendshapeVector: template({
      eyeWideLeft: 0.5,
      eyeWideRight: 0.5,
      mouthSmileLeft: 0.7,
      mouthSmileRight: 0.7,
      browInnerUp: 0.4,
      browOuterUpLeft: 0.3,
      browOuterUpRight: 0.3,
      cheekSquintLeft: 0.4,
      cheekSquintRight: 0.4,
      jawOpen: 0.2,
    }),
  },
  {
    emotionName: "fear",
    description: "Anxiety from perceived threat",
    blendshapeVector: template({
      browInnerUp: 0.8,
      browOuterUpLeft: 0.5,
      browOuterUpRight: 0.5,
      eyeWideLeft: 0.9,
      eyeWideRight: 0.9,
      mouthStretchLeft: 0.5,
      mouthStretchRight: 0.5,
      jawOpen: 0.35,
      mouthFrownLeft: 0.2,
      mouthFrownRight: 0.2,
    }),
  },
  {
    emotionName: "gratitude",
    description: "Thankfulness, appreciation",
    blendshapeVector: template({
      mouthSmileLeft: 0.55,
      mouthSmileRight: 0.55,
      browInnerUp: 0.25,
      eyeSquintLeft: 0.2,
      eyeSquintRight: 0.2,
      cheekSquintLeft: 0.2,
      cheekSquintRight: 0.2,
    }),
  },
  {
    emotionName: "grief",
    description: "Deep sorrow, mourning",
    blendshapeVector: template({
      mouthFrownLeft: 0.8,
      mouthFrownRight: 0.8,
      browInnerUp: 0.7,
      eyeSquintLeft: 0.4,
      eyeSquintRight: 0.4,
      jawOpen: 0.15,
      mouthStretchLeft: 0.3,
      mouthStretchRight: 0.3,
      mouthLowerDownLeft: 0.3,
      mouthLowerDownRight: 0.3,
    }),
  },
  {
    emotionName: "joy",
    description: "Happiness, delight",
    blendshapeVector: template({
      mouthSmileLeft: 0.85,
      mouthSmileRight: 0.85,
      cheekSquintLeft: 0.6,
      cheekSquintRight: 0.6,
      eyeSquintLeft: 0.3,
      eyeSquintRight: 0.3,
      mouthDimpleLeft: 0.3,
      mouthDimpleRight: 0.3,
      browInnerUp: 0.15,
    }),
  },
  {
    emotionName: "love",
    description: "Deep affection, tenderness",
    blendshapeVector: template({
      mouthSmileLeft: 0.5,
      mouthSmileRight: 0.5,
      eyeSquintLeft: 0.3,
      eyeSquintRight: 0.3,
      cheekSquintLeft: 0.25,
      cheekSquintRight: 0.25,
      browInnerUp: 0.2,
      mouthPucker: 0.15,
    }),
  },
  {
    emotionName: "nervousness",
    description: "Anxiety, unease",
    blendshapeVector: template({
      browInnerUp: 0.5,
      eyeWideLeft: 0.3,
      eyeWideRight: 0.3,
      mouthStretchLeft: 0.2,
      mouthStretchRight: 0.2,
      mouthPressLeft: 0.35,
      mouthPressRight: 0.35,
      jawOpen: 0.05,
    }),
  },
  {
    emotionName: "optimism",
    description: "Hopefulness, positive expectation",
    blendshapeVector: template({
      mouthSmileLeft: 0.45,
      mouthSmileRight: 0.45,
      browInnerUp: 0.2,
      browOuterUpLeft: 0.15,
      browOuterUpRight: 0.15,
      eyeSquintLeft: 0.1,
      eyeSquintRight: 0.1,
      cheekSquintLeft: 0.2,
      cheekSquintRight: 0.2,
    }),
  },
  {
    emotionName: "pride",
    description: "Satisfaction in achievement",
    blendshapeVector: template({
      mouthSmileLeft: 0.45,
      mouthSmileRight: 0.45,
      browInnerUp: 0.1,
      cheekSquintLeft: 0.2,
      cheekSquintRight: 0.2,
      jawForward: 0.1,
      mouthDimpleLeft: 0.2,
      mouthDimpleRight: 0.2,
    }),
  },
  {
    emotionName: "realization",
    description: "Sudden understanding, aha moment",
    blendshapeVector: template({
      browInnerUp: 0.5,
      browOuterUpLeft: 0.4,
      browOuterUpRight: 0.4,
      eyeWideLeft: 0.45,
      eyeWideRight: 0.45,
      jawOpen: 0.25,
      mouthFunnel: 0.15,
    }),
  },
  {
    emotionName: "relief",
    description: "Release from stress or anxiety",
    blendshapeVector: template({
      mouthSmileLeft: 0.35,
      mouthSmileRight: 0.35,
      eyeBlinkLeft: 0.2,
      eyeBlinkRight: 0.2,
      browInnerUp: 0.1,
      jawOpen: 0.1,
      mouthShrugLower: 0.15,
    }),
  },
  {
    emotionName: "remorse",
    description: "Regret, guilt",
    blendshapeVector: template({
      mouthFrownLeft: 0.5,
      mouthFrownRight: 0.5,
      browInnerUp: 0.55,
      eyeLookDownLeft: 0.4,
      eyeLookDownRight: 0.4,
      mouthPressLeft: 0.25,
      mouthPressRight: 0.25,
    }),
  },
  {
    emotionName: "sadness",
    description: "Unhappiness, sorrow",
    blendshapeVector: template({
      mouthFrownLeft: 0.7,
      mouthFrownRight: 0.7,
      browInnerUp: 0.6,
      browDownLeft: 0.3,
      browDownRight: 0.3,
      eyeSquintLeft: 0.2,
      eyeSquintRight: 0.2,
      mouthPressLeft: 0.3,
      mouthPressRight: 0.3,
      jawOpen: 0.05,
    }),
  },
  {
    emotionName: "surprise",
    description: "Unexpected event reaction",
    blendshapeVector: template({
      browInnerUp: 0.9,
      browOuterUpLeft: 0.8,
      browOuterUpRight: 0.8,
      eyeWideLeft: 0.85,
      eyeWideRight: 0.85,
      jawOpen: 0.6,
      mouthFunnel: 0.3,
    }),
  },
] as const satisfies ReadonlyArray<{
  emotionName: string;
  description: string;
  blendshapeVector: BlendshapeVector;
}>;

async function seed(): Promise<void> {
  console.log("Seeding emotion templates...");
  for (const data of EMOTION_TEMPLATE_DATA) {
    await db
      .insert(emotionTemplates)
      .values(data)
      .onConflictDoNothing({ target: emotionTemplates.emotionName });
  }
  console.log(`Seeded ${EMOTION_TEMPLATE_DATA.length} emotion templates.`);

  console.log("Seeding default character...");
  await db
    .insert(characters)
    .values({
      name: "Default Avatar",
      modelUrl: "/models/avatar-WCpLm2TimIAYnTVYq3uS.glb",
      description: "Default Ready Player Me avatar with ARKit blendshapes",
    })
    .onConflictDoNothing();

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
