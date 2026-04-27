import type { WsServerMessage } from "@shared/types/websocket.ts";

export function isWsServerMessage(data: unknown): data is WsServerMessage {
  if (typeof data !== "object" || data === null) return false;
  if (!("type" in data)) return false;

  const { type } = data;
  return (
    type === "blendshape_update" ||
    type === "error" ||
    type === "pong" ||
    type === "mood_state"
  );
}
