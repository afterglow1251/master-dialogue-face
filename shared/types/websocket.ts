import type { BlendshapeVector } from "./blendshape.ts";
import type {
  EmotionProbabilities,
  EmotionScore,
  VADValues,
} from "./emotion.ts";
import type { CombinedEmotionalState, MoodState } from "./mood.ts";

// ── Client → Server ──

interface WsAnalyzeMessage {
  readonly type: "analyze";
  readonly dialogueId: string;
  readonly text: string;
}

interface WsSettingsUpdateMessage {
  readonly type: "settings_update";
  readonly settings: {
    readonly smoothingAlpha?: number;
    readonly contextWindowSize?: number;
    readonly expressionIntensity?: number;
    readonly moodReactivity?: number;
    readonly moodDecaySeconds?: number;
    readonly emotionWeight?: number;
  };
}

interface WsPingMessage {
  readonly type: "ping";
}

interface WsMoodResetMessage {
  readonly type: "mood_reset";
  readonly dialogueId: string;
}

export type WsClientMessage =
  | WsAnalyzeMessage
  | WsSettingsUpdateMessage
  | WsPingMessage
  | WsMoodResetMessage;

// ── Server → Client ──

interface WsBlendshapeResult {
  readonly type: "blendshape_update";
  readonly turnId: string;
  readonly text: string;
  readonly emotions: {
    readonly categories: EmotionProbabilities;
    readonly vad: VADValues;
    readonly topEmotions: readonly EmotionScore[];
  };
  readonly mood: MoodState;
  readonly combinedEmotions: CombinedEmotionalState;
  readonly blendshapes: BlendshapeVector;
  readonly processingTimeMs: number;
}

interface WsErrorMessage {
  readonly type: "error";
  readonly message: string;
  readonly code: string;
}

interface WsPongMessage {
  readonly type: "pong";
}

interface WsMoodStateMessage {
  readonly type: "mood_state";
  readonly dialogueId: string;
  readonly mood: MoodState;
  readonly blendshapes: BlendshapeVector;
}

export type WsServerMessage =
  | WsBlendshapeResult
  | WsErrorMessage
  | WsPongMessage
  | WsMoodStateMessage;
