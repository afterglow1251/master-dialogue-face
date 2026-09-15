import Anthropic from "@anthropic-ai/sdk";

import { config } from "../config.ts";
import type { SpeechLanguage, TurnRole } from "../types/index.ts";
import {
  SAY_LINE_PREFIX,
  TRANSLATION_SEPARATOR,
  USER_LINE_PREFIX,
  createReplyParser,
  type ReplyEvent,
} from "../utils/reply-format.ts";

export interface HistoryTurn {
  readonly role: TurnRole;
  readonly text: string;
}

const LANGUAGE_NAMES = new Map<SpeechLanguage, string>([
  ["uk", "Ukrainian"],
  ["en", "English"],
]);

const SPEAKER_LABELS = new Map<TurnRole, string>([
  ["user", "User"],
  ["assistant", "Avatar"],
]);

const client = new Anthropic({ apiKey: config.llm.apiKey });

export class LlmRefusalError extends Error {
  constructor() {
    super("The language model declined to answer this message");
  }
}

export function buildSystemPrompt(language: SpeechLanguage): string {
  const languageName = LANGUAGE_NAMES.get(language) ?? "English";

  return [
    "You are a friendly, emotionally expressive 3D avatar of a man having a live spoken conversation with the user.",
    "You are male: in languages with grammatical gender (such as Ukrainian) always use masculine forms when referring to yourself, for example «я радий», «я втомився».",
    "Your words are converted to speech and your face animates from the emotion of each sentence, so let your feelings show naturally in what you say.",
    "",
    "Reply rules:",
    `- Speak ${languageName}.`,
    "- Keep replies short and conversational: one to four sentences.",
    "- Plain spoken language only: no markdown, lists, emoji, URLs, or stage directions.",
    "",
    "Output format (every line must follow it exactly):",
    `1. First line: ${USER_LINE_PREFIX} <faithful English translation of the user's latest message>`,
    `2. Then one line per sentence of your reply: ${SAY_LINE_PREFIX} <sentence in ${languageName}> ${TRANSLATION_SEPARATOR} <faithful English translation of that sentence>`,
    "Translations must preserve the emotional tone. If the text is already English, repeat it unchanged.",
    "Output nothing else.",
  ].join("\n");
}

export function buildUserPrompt(
  history: readonly HistoryTurn[],
  userText: string,
): string {
  const transcript = history
    .map((turn) => `${SPEAKER_LABELS.get(turn.role) ?? "User"}: ${turn.text}`)
    .join("\n");

  return [
    "<conversation_history>",
    transcript,
    "</conversation_history>",
    "",
    "<latest_user_message>",
    userText,
    "</latest_user_message>",
  ].join("\n");
}

export async function* streamReply(params: {
  readonly history: readonly HistoryTurn[];
  readonly userText: string;
  readonly language: SpeechLanguage;
  readonly signal: AbortSignal;
}): AsyncGenerator<ReplyEvent> {
  const stream = client.messages.stream(
    {
      model: config.llm.model,
      max_tokens: config.llm.maxTokens,
      system: buildSystemPrompt(params.language),
      messages: [
        {
          role: "user",
          content: buildUserPrompt(params.history, params.userText),
        },
      ],
    },
    { signal: params.signal },
  );

  const parser = createReplyParser();

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield* parser.push(event.delta.text);
    }
  }

  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") {
    throw new LlmRefusalError();
  }

  yield* parser.flush();
}
