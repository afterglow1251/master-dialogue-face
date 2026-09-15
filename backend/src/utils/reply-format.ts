export const USER_LINE_PREFIX = "USER:";
export const SAY_LINE_PREFIX = "SAY:";
export const TRANSLATION_SEPARATOR = "|||";

export interface UserTranslationEvent {
  readonly type: "user_translation";
  readonly analysisText: string;
}

export interface SentenceEvent {
  readonly type: "sentence";
  readonly text: string;
  readonly analysisText: string;
}

export type ReplyEvent = UserTranslationEvent | SentenceEvent;

export function parseReplyLine(rawLine: string): ReplyEvent | null {
  const line = rawLine.trim();
  if (line.length === 0) return null;

  if (line.startsWith(USER_LINE_PREFIX)) {
    const analysisText = line.slice(USER_LINE_PREFIX.length).trim();
    if (analysisText.length === 0) return null;
    return { type: "user_translation", analysisText };
  }

  const body = line.startsWith(SAY_LINE_PREFIX)
    ? line.slice(SAY_LINE_PREFIX.length)
    : line;
  const separatorIndex = body.indexOf(TRANSLATION_SEPARATOR);
  const text = (
    separatorIndex === -1 ? body : body.slice(0, separatorIndex)
  ).trim();
  if (text.length === 0) return null;

  const translation =
    separatorIndex === -1
      ? ""
      : body.slice(separatorIndex + TRANSLATION_SEPARATOR.length).trim();

  return {
    type: "sentence",
    text,
    analysisText: translation.length > 0 ? translation : text,
  };
}

export function createReplyParser() {
  let buffer = "";

  function push(chunk: string): ReplyEvent[] {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    return lines.flatMap((line) => parseReplyLine(line) ?? []);
  }

  function flush(): ReplyEvent[] {
    const event = parseReplyLine(buffer);
    buffer = "";
    return event ? [event] : [];
  }

  return { push, flush };
}
