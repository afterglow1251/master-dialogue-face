function requireEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  apiBaseUrl: requireEnv("VITE_API_BASE_URL"),
  wsUrl: requireEnv("VITE_WS_URL"),
  clerkPublishableKey: requireEnv("VITE_CLERK_PUBLISHABLE_KEY"),
} as const;
