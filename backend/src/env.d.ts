declare module "bun" {
  interface Env {
    // Server
    readonly PORT: string;

    // Database
    readonly DATABASE_URL: string;

    // Clerk auth
    readonly CLERK_SECRET_KEY: string;
    readonly CLERK_PUBLISHABLE_KEY: string;

    // NLP service
    readonly NLP_SERVICE_URL: string;
    readonly NLP_ANALYZE_TIMEOUT_MS: string;
    readonly NLP_HEALTH_TIMEOUT_MS: string;

    // WebSocket
    readonly WS_DEFAULT_CONTEXT_WINDOW_SIZE: string;
    readonly WS_DEFAULT_EXPRESSION_INTENSITY: string;
    readonly WS_MAX_CONTEXT_WINDOW_SIZE: string;
    readonly WS_MAX_EXPRESSION_INTENSITY: string;
  }
}
