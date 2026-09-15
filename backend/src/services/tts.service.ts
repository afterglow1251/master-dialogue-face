import { config } from "../config.ts";
import type { SpeechAlignment, SpeechLanguage } from "../types/index.ts";

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";
const PREVIOUS_TEXT_MAX_LENGTH = 500;

export interface SynthesizedSpeech {
  readonly audioBase64: string;
  readonly alignment: SpeechAlignment;
}

export class TtsError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

interface ElevenLabsAlignment {
  readonly characters: readonly string[];
  readonly character_start_times_seconds: readonly number[];
  readonly character_end_times_seconds: readonly number[];
}

interface ElevenLabsTimestampsResponse {
  readonly audio_base64: string;
  readonly alignment: ElevenLabsAlignment;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function isNumberArray(value: unknown): value is readonly number[] {
  return Array.isArray(value) && value.every((v) => typeof v === "number");
}

function isElevenLabsAlignment(value: unknown): value is ElevenLabsAlignment {
  if (!isRecord(value)) return false;
  const {
    characters,
    character_start_times_seconds,
    character_end_times_seconds,
  } = value;
  return (
    isStringArray(characters) &&
    isNumberArray(character_start_times_seconds) &&
    isNumberArray(character_end_times_seconds) &&
    characters.length === character_start_times_seconds.length &&
    characters.length === character_end_times_seconds.length
  );
}

function isElevenLabsTimestampsResponse(
  value: unknown,
): value is ElevenLabsTimestampsResponse {
  return (
    isRecord(value) &&
    typeof value["audio_base64"] === "string" &&
    isElevenLabsAlignment(value["alignment"])
  );
}

export async function synthesizeSpeech(params: {
  readonly text: string;
  readonly language: SpeechLanguage;
  readonly previousText: string;
  readonly signal: AbortSignal;
}): Promise<SynthesizedSpeech> {
  const url = new URL(
    `${ELEVENLABS_BASE_URL}/text-to-speech/${encodeURIComponent(config.tts.voiceId)}/with-timestamps`,
  );
  url.searchParams.set("output_format", config.tts.outputFormat);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": config.tts.apiKey,
    },
    body: JSON.stringify({
      text: params.text,
      model_id: config.tts.modelId,
      language_code: params.language,
      previous_text: params.previousText.slice(-PREVIOUS_TEXT_MAX_LENGTH),
    }),
    signal: AbortSignal.any([
      params.signal,
      AbortSignal.timeout(config.tts.timeoutMs),
    ]),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new TtsError(
      response.status,
      `ElevenLabs text-to-speech failed (${response.status}): ${details}`,
    );
  }

  const json: unknown = await response.json();
  if (!isElevenLabsTimestampsResponse(json)) {
    throw new TtsError(
      response.status,
      "ElevenLabs returned an unexpected response format (missing audio or character alignment)",
    );
  }

  return {
    audioBase64: json.audio_base64,
    alignment: {
      characters: json.alignment.characters,
      startTimes: json.alignment.character_start_times_seconds,
      endTimes: json.alignment.character_end_times_seconds,
    },
  };
}
