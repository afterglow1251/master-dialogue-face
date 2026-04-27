const REQUIRED_VARS = [
  "DATABASE_URL",
  "CLERK_SECRET_KEY",
  "CLERK_PUBLISHABLE_KEY",
  "NLP_SERVICE_URL",
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
  nlpServiceUrl: Bun.env.NLP_SERVICE_URL,
  clerk: {
    secretKey: Bun.env.CLERK_SECRET_KEY,
    publishableKey: Bun.env.CLERK_PUBLISHABLE_KEY,
  },
  nlp: {
    analyzeTimeoutMs: Number(Bun.env.NLP_ANALYZE_TIMEOUT_MS ?? "10000"),
    healthTimeoutMs: Number(Bun.env.NLP_HEALTH_TIMEOUT_MS ?? "5000"),
  },
  ws: {
    defaultContextWindowSize: Number(
      Bun.env.WS_DEFAULT_CONTEXT_WINDOW_SIZE ?? "3",
    ),
    defaultExpressionIntensity: Number(
      Bun.env.WS_DEFAULT_EXPRESSION_INTENSITY ?? "1.0",
    ),
    maxContextWindowSize: Number(Bun.env.WS_MAX_CONTEXT_WINDOW_SIZE ?? "10"),
    maxExpressionIntensity: Number(
      Bun.env.WS_MAX_EXPRESSION_INTENSITY ?? "2.0",
    ),
  },
  mood: {
    defaultReactivity: Number(Bun.env.MOOD_DEFAULT_REACTIVITY ?? "0.3"),
    defaultDecaySeconds: Number(Bun.env.MOOD_DEFAULT_DECAY_SECONDS ?? "300"),
    defaultEmotionWeight: Number(Bun.env.MOOD_DEFAULT_EMOTION_WEIGHT ?? "0.7"),
    maxDecaySeconds: Number(Bun.env.MOOD_MAX_DECAY_SECONDS ?? "3600"),
  },
} as const;
