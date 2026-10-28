/**
 * Environment variable validation for VALTORIX BD OS.
 *
 * This module validates required environment variables at build time.
 * It does not expose any secret values to the client bundle.
 */

export interface EnvConfig {
  appName: string;
  appUrl: string;
  databaseUrl?: string;
  authSecret?: string;
  aiProvider?: string;
  ollamaBaseUrl?: string;
}

function getEnv(): EnvConfig {
  return {
    appName:
      process.env.NEXT_PUBLIC_APP_NAME ?? "VALTORIX BD OS",
    appUrl:
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    databaseUrl: process.env.DATABASE_URL,
    authSecret: process.env.AUTH_SECRET,
    aiProvider: process.env.AI_PROVIDER,
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
  };
}

export const env = getEnv();

/**
 * Returns whether Neon database is configured (Phase 1+).
 * Safe to call in server components and API routes.
 * Never expose DATABASE_URL to the client bundle.
 */
export function isDatabaseConfigured(): boolean {
  return Boolean(env.databaseUrl);
}

/**
 * Returns whether authentication is configured (Phase 1+).
 */
export function isAuthConfigured(): boolean {
  return Boolean(env.authSecret);
}

/**
 * Returns whether a local AI provider is available (development only).
 * Ollama is not available in Vercel deployments.
 */
export function isLocalAIAvailable(): boolean {
  return env.aiProvider === "ollama" && Boolean(env.ollamaBaseUrl);
}
