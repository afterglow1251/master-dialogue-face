import {
  isExpressionMode,
  type ExpressionMode,
} from "@shared/types/blendshape.ts";

const DEFAULT_EXPRESSION_MODE: ExpressionMode = "facs";

function readExpressionMode(): ExpressionMode {
  const raw = Bun.env.EXPRESSION_MODE;
  return isExpressionMode(raw) ? raw : DEFAULT_EXPRESSION_MODE;
}

const REQUIRED_VARS = [
  "DATABASE_URL",
  "CLERK_SECRET_KEY",
  "CLERK_PUBLISHABLE_KEY",
  "ANTHROPIC_API_KEY",
  "HF_TOKEN",
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_VOICE_ID",
] as const satisfies ReadonlyArray<keyof import("bun").Env>;

function validateEnv(): void {
  const missing = REQUIRED_VARS.filter((key) => !Bun.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join("\n")}`,
    );
  }
}

validateEnv();

export const config = {
  port: Number(Bun.env.PORT ?? "3000"),
  databaseUrl: Bun.env.DATABASE_URL,
  clerk: {
    secretKey: Bun.env.CLERK_SECRET_KEY,
    publishableKey: Bun.env.CLERK_PUBLISHABLE_KEY,
  },
  emotion: {
    hfToken: Bun.env.HF_TOKEN,
    model: Bun.env.HF_EMOTION_MODEL ?? "SamLowe/roberta-base-go_emotions",
    timeoutMs: Number(Bun.env.HF_EMOTION_TIMEOUT_MS ?? "15000"),
  },
  llm: {
    apiKey: Bun.env.ANTHROPIC_API_KEY,
    model: Bun.env.LLM_MODEL ?? "claude-haiku-4-5",
    maxTokens: Number(Bun.env.LLM_MAX_TOKENS ?? "2048"),
    historyTurns: Number(Bun.env.LLM_HISTORY_TURNS ?? "20"),
  },
  tts: {
    apiKey: Bun.env.ELEVENLABS_API_KEY,
    voiceId: Bun.env.ELEVENLABS_VOICE_ID,
    modelId: Bun.env.ELEVENLABS_MODEL_ID ?? "eleven_flash_v2_5",
    outputFormat: Bun.env.ELEVENLABS_OUTPUT_FORMAT ?? "mp3_44100_64",
    timeoutMs: Number(Bun.env.ELEVENLABS_TIMEOUT_MS ?? "20000"),
  },
  ws: {
    defaultExpressionIntensity: Number(
      Bun.env.WS_DEFAULT_EXPRESSION_INTENSITY ?? "1.0",
    ),
    maxExpressionIntensity: Number(
      Bun.env.WS_MAX_EXPRESSION_INTENSITY ?? "2.0",
    ),
    maxChatTextLength: Number(Bun.env.WS_MAX_CHAT_TEXT_LENGTH ?? "2000"),
  },
  expression: {
    defaultMode: readExpressionMode(),
  },
  mood: {
    defaultReactivity: Number(Bun.env.MOOD_DEFAULT_REACTIVITY ?? "0.3"),
    defaultDecaySeconds: Number(Bun.env.MOOD_DEFAULT_DECAY_SECONDS ?? "300"),
    defaultEmotionWeight: Number(Bun.env.MOOD_DEFAULT_EMOTION_WEIGHT ?? "0.7"),
    maxDecaySeconds: Number(Bun.env.MOOD_MAX_DECAY_SECONDS ?? "3600"),
  },
} as const;
