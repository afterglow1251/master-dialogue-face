import { Elysia } from "elysia";

import { config } from "../config.ts";
import {
  describeConversationError,
  runConversationTurn,
} from "../services/conversation.service.ts";
import * as dialogueService from "../services/dialogue.service.ts";
import * as emotionalState from "../services/emotional-state.service.ts";
import { verifyToken } from "../services/auth.ts";
import { resolveUserIdFromClerkId } from "./auth-middleware.ts";
import {
  createEmptyBlendshapeVector,
  isSpeechLanguage,
  toDialogueId,
  toUserId,
} from "../types/index.ts";
import type {
  WsClientMessage,
  WsServerMessage,
} from "@shared/types/websocket.ts";

// ── Type guard ──

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isWsClientMessage(data: unknown): data is WsClientMessage {
  if (!isRecord(data)) return false;
  if (!("type" in data)) return false;

  switch (data["type"]) {
    case "chat":
      return (
        typeof data["requestId"] === "string" &&
        typeof data["dialogueId"] === "string" &&
        typeof data["text"] === "string" &&
        isSpeechLanguage(data["language"])
      );
    case "chat_cancel":
      return true;
    case "settings_update":
      return isRecord(data["settings"]);
    case "mood_reset":
      return typeof data["dialogueId"] === "string";
    case "ping":
      return true;
    default:
      return false;
  }
}

// ── Per-connection session state ──

interface SessionState {
  userId: string;
  expressionIntensity: number;
  moodReactivity: number;
  moodDecaySeconds: number;
  emotionWeight: number;
  activeChat: AbortController | null;
}

const sessions = new Map<string, SessionState>();

function getSession(wsId: string, userId: string): SessionState {
  let session = sessions.get(wsId);
  if (!session) {
    session = {
      userId,
      expressionIntensity: config.ws.defaultExpressionIntensity,
      moodReactivity: config.mood.defaultReactivity,
      moodDecaySeconds: config.mood.defaultDecaySeconds,
      emotionWeight: config.mood.defaultEmotionWeight,
      activeChat: null,
    };
    sessions.set(wsId, session);
  }
  return session;
}

// ── WebSocket routes ──

export const wsRoutes = new Elysia()
  .derive(async ({ request }) => {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return { wsUserId: null };
    }

    const clerkUserId = await verifyToken(token);
    if (!clerkUserId) {
      return { wsUserId: null };
    }

    try {
      const userId = await resolveUserIdFromClerkId(clerkUserId);
      return { wsUserId: userId };
    } catch {
      return { wsUserId: null };
    }
  })
  .ws("/ws", {
    beforeHandle({ wsUserId, set }) {
      if (!wsUserId) {
        set.status = 401;
        return "Unauthorized";
      }
      return undefined;
    },

    open(_ws) {
      // Session created lazily in getSession
    },

    close(ws) {
      sessions.get(ws.id)?.activeChat?.abort();
      sessions.delete(ws.id);
    },

    async message(ws, rawMessage) {
      const { wsUserId } = ws.data;
      if (!wsUserId) {
        // Guarded by beforeHandle, but narrows type for TypeScript
        return;
      }

      let parsed: unknown;
      if (typeof rawMessage === "string") {
        try {
          parsed = JSON.parse(rawMessage);
        } catch {
          const error: WsServerMessage = {
            type: "error",
            message: "Invalid JSON",
            code: "INVALID_FORMAT",
          };
          ws.send(JSON.stringify(error));
          return;
        }
      } else {
        parsed = rawMessage;
      }

      if (!isWsClientMessage(parsed)) {
        const error: WsServerMessage = {
          type: "error",
          message: "Invalid message format",
          code: "INVALID_FORMAT",
        };
        ws.send(JSON.stringify(error));
        return;
      }

      switch (parsed.type) {
        case "ping": {
          const pong: WsServerMessage = { type: "pong" };
          ws.send(JSON.stringify(pong));
          break;
        }

        case "settings_update": {
          const session = getSession(ws.id, wsUserId);
          if (parsed.settings.expressionIntensity !== undefined) {
            session.expressionIntensity = Math.min(
              Math.max(0.0, parsed.settings.expressionIntensity),
              config.ws.maxExpressionIntensity,
            );
          }
          if (parsed.settings.moodReactivity !== undefined) {
            session.moodReactivity = Math.min(
              Math.max(0.01, parsed.settings.moodReactivity),
              1.0,
            );
          }
          if (parsed.settings.moodDecaySeconds !== undefined) {
            session.moodDecaySeconds = Math.min(
              Math.max(10, parsed.settings.moodDecaySeconds),
              config.mood.maxDecaySeconds,
            );
          }
          if (parsed.settings.emotionWeight !== undefined) {
            session.emotionWeight = Math.min(
              Math.max(0.0, parsed.settings.emotionWeight),
              1.0,
            );
          }
          break;
        }

        case "mood_reset": {
          try {
            const session = getSession(ws.id, wsUserId);
            const dialogueId = toDialogueId(parsed.dialogueId);
            await dialogueService.verifyDialogueOwnership(
              dialogueId,
              toUserId(session.userId),
            );
            const mood = await emotionalState.resetMoodState(dialogueId);

            const result: WsServerMessage = {
              type: "mood_state",
              dialogueId: parsed.dialogueId,
              mood,
              blendshapes: createEmptyBlendshapeVector(),
            };
            ws.send(JSON.stringify(result));
          } catch (err) {
            const error: WsServerMessage = {
              type: "error",
              message: err instanceof Error ? err.message : "Unknown error",
              code: "MOOD_RESET_FAILED",
            };
            ws.send(JSON.stringify(error));
          }
          break;
        }

        case "chat_cancel": {
          const session = sessions.get(ws.id);
          session?.activeChat?.abort();
          break;
        }

        case "chat": {
          const session = getSession(ws.id, wsUserId);
          const text = parsed.text.trim();

          if (text.length === 0 || text.length > config.ws.maxChatTextLength) {
            const error: WsServerMessage = {
              type: "error",
              message: `Message must be between 1 and ${config.ws.maxChatTextLength} characters`,
              code: "INVALID_FORMAT",
            };
            ws.send(JSON.stringify(error));
            break;
          }

          session.activeChat?.abort();
          const controller = new AbortController();
          session.activeChat = controller;

          try {
            const dialogueId = toDialogueId(parsed.dialogueId);
            await dialogueService.verifyDialogueOwnership(
              dialogueId,
              toUserId(session.userId),
            );

            await runConversationTurn({
              requestId: parsed.requestId,
              dialogueId,
              text,
              language: parsed.language,
              settings: {
                expressionIntensity: session.expressionIntensity,
                moodReactivity: session.moodReactivity,
                moodDecaySeconds: session.moodDecaySeconds,
                emotionWeight: session.emotionWeight,
              },
              signal: controller.signal,
              send: (message) => ws.send(JSON.stringify(message)),
            });
          } catch (err) {
            if (!controller.signal.aborted) {
              console.error("[chat]", err);
              const error: WsServerMessage = {
                type: "error",
                message: describeConversationError(err),
                code: "CHAT_FAILED",
              };
              ws.send(JSON.stringify(error));
            }
          } finally {
            if (session.activeChat === controller) session.activeChat = null;
          }
          break;
        }
      }
    },
  });
