import type {
  BlendshapeVector,
  BlendshapesByMode,
  ExpressionMode,
} from "./blendshape.ts";
import type {
  EmotionProbabilities,
  EmotionScore,
  VADValues,
} from "./emotion.ts";
import type { CombinedEmotionalState, MoodState } from "./mood.ts";
import type { SpeechAlignment, SpeechLanguage, TurnRole } from "./speech.ts";

// ── Client → Server ──

interface WsChatMessage {
  readonly type: "chat";
  readonly requestId: string;
  readonly dialogueId: string;
  readonly text: string;
  readonly language: SpeechLanguage;
}

interface WsChatCancelMessage {
  readonly type: "chat_cancel";
}

interface WsSettingsUpdateMessage {
  readonly type: "settings_update";
  readonly settings: {
    readonly smoothingAlpha?: number;
    readonly expressionIntensity?: number;
    readonly expressionMode?: ExpressionMode;
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
  | WsChatMessage
  | WsChatCancelMessage
  | WsSettingsUpdateMessage
  | WsPingMessage
  | WsMoodResetMessage;

// ── Server → Client ──

export interface WsTurnEmotions {
  readonly categories: EmotionProbabilities;
  readonly vad: VADValues;
  readonly topEmotions: readonly EmotionScore[];
}

export interface WsBlendshapeResult {
  readonly type: "blendshape_update";
  readonly requestId: string;
  readonly role: TurnRole;
  readonly turnId: string;
  readonly text: string;
  readonly emotions: WsTurnEmotions;
  readonly mood: MoodState;
  readonly combinedEmotions: CombinedEmotionalState;
  readonly blendshapes: BlendshapeVector;
  readonly blendshapesByMode: BlendshapesByMode;
  readonly processingTimeMs: number;
}

export interface WsSpeechChunk {
  readonly type: "speech_chunk";
  readonly requestId: string;
  readonly index: number;
  readonly text: string;
  readonly audioBase64: string;
  readonly alignment: SpeechAlignment;
  readonly emotions: WsTurnEmotions;
  readonly blendshapes: BlendshapeVector;
  readonly blendshapesByMode: BlendshapesByMode;
}

interface WsReplyEnd {
  readonly type: "reply_end";
  readonly requestId: string;
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
  | WsSpeechChunk
  | WsReplyEnd
  | WsErrorMessage
  | WsPongMessage
  | WsMoodStateMessage;
