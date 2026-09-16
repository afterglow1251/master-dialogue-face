import type { SpeechAlignment } from "@shared/types/speech";
import type { WsServerMessage } from "@shared/types/websocket.ts";

const SERVER_MESSAGE_TYPES: ReadonlySet<unknown> = new Set([
  "blendshape_update",
  "speech_chunk",
  "reply_end",
  "error",
  "pong",
  "mood_state",
] satisfies WsServerMessage["type"][]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((v) => typeof v === "number");
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function isSpeechAlignment(value: unknown): value is SpeechAlignment {
  if (!isRecord(value)) return false;
  const { characters, startTimes, endTimes } = value;
  return (
    isStringArray(characters) &&
    isNumberArray(startTimes) &&
    isNumberArray(endTimes) &&
    characters.length === startTimes.length &&
    characters.length === endTimes.length
  );
}

function isSpeechChunkPayload(data: Record<string, unknown>): boolean {
  return (
    typeof data["requestId"] === "string" &&
    typeof data["index"] === "number" &&
    typeof data["text"] === "string" &&
    typeof data["audioBase64"] === "string" &&
    isSpeechAlignment(data["alignment"]) &&
    isRecord(data["emotions"]) &&
    isRecord(data["blendshapes"]) &&
    isRecord(data["blendshapesByMode"])
  );
}

export function isWsServerMessage(data: unknown): data is WsServerMessage {
  if (!isRecord(data)) return false;
  if (!SERVER_MESSAGE_TYPES.has(data["type"])) return false;
  if (data["type"] === "speech_chunk") return isSpeechChunkPayload(data);
  return true;
}
