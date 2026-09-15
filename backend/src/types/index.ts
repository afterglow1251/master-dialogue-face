export {
  toDialogueId,
  toCharacterId,
  toUserId,
  type DialogueId,
  type CharacterId,
  type UserId,
} from "./brand.ts";

// Re-export shared types so backend code keeps importing from "@/types"
export {
  ARKIT_BLENDSHAPES,
  EXPRESSION_MODES,
  createEmptyBlendshapeVector,
  isExpressionMode,
  type ArkitBlendshapeName,
  type BlendshapeVector,
  type ExpressionMode,
} from "@shared/types/blendshape.ts";

export {
  EMOTION_LABELS,
  type EmotionLabel,
  type EmotionProbabilities,
  type VADValues,
  type EmotionScore,
} from "@shared/types/emotion.ts";

export {
  NEUTRAL_VAD,
  type MoodState,
  type CombinedEmotionalState,
  type MoodParameters,
} from "@shared/types/mood.ts";

export {
  isSpeechLanguage,
  isTurnRole,
  type SpeechAlignment,
  type SpeechLanguage,
  type TurnRole,
} from "@shared/types/speech.ts";

// Backend-only types and guards
export {
  isEmotionAnalysisResult,
  isEmotionLabel,
  type EmotionAnalysisResult,
} from "./emotion.ts";
