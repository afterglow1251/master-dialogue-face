import {
  createEmptyBlendshapeVector,
  type BlendshapeVector,
} from "@shared/types/blendshape";
import { SPEECH_EMOTION_MOUTH_WEIGHT } from "@/utils/constants";
import { MOUTH_BLENDSHAPES, type MouthShape } from "@/utils/visemes";

const MAX_BLENDSHAPE_VALUE = 1;

export function composeSpeechTarget(
  emotion: BlendshapeVector | null,
  mouth: MouthShape | null,
): BlendshapeVector | null {
  if (!mouth) return emotion;

  const target = { ...(emotion ?? createEmptyBlendshapeVector()) };
  for (const name of MOUTH_BLENDSHAPES) {
    const speech = mouth[name] ?? 0;
    const expression = target[name] * SPEECH_EMOTION_MOUTH_WEIGHT;
    target[name] = Math.min(MAX_BLENDSHAPE_VALUE, speech + expression);
  }
  return target;
}
