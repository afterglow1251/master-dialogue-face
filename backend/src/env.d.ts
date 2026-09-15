declare module "bun" {
  interface Env {
    // Server
    readonly PORT: string;

    // Database
    readonly DATABASE_URL: string;

    // Clerk auth
    readonly CLERK_SECRET_KEY: string;
    readonly CLERK_PUBLISHABLE_KEY: string;

    // Emotion model (Hugging Face Inference Providers)
    readonly HF_TOKEN: string;
    readonly HF_EMOTION_MODEL: string;
    readonly HF_EMOTION_TIMEOUT_MS: string;

    // LLM (Anthropic)
    readonly ANTHROPIC_API_KEY: string;
    readonly LLM_MODEL: string;
    readonly LLM_MAX_TOKENS: string;
    readonly LLM_HISTORY_TURNS: string;

    // Text-to-speech (ElevenLabs)
    readonly ELEVENLABS_API_KEY: string;
    readonly ELEVENLABS_VOICE_ID: string;
    readonly ELEVENLABS_MODEL_ID: string;
    readonly ELEVENLABS_OUTPUT_FORMAT: string;
    readonly ELEVENLABS_TIMEOUT_MS: string;

    // WebSocket
    readonly WS_DEFAULT_EXPRESSION_INTENSITY: string;
    readonly WS_MAX_EXPRESSION_INTENSITY: string;
    readonly WS_MAX_CHAT_TEXT_LENGTH: string;

    // Expression composition ("linear" | "facs")
    readonly EXPRESSION_MODE: string;
  }
}
