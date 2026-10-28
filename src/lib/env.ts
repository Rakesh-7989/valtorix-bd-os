/**
 * Environment variable validation for VALTORIX BD OS.
 *
 * This module validates required environment variables at build time.
 * It does not expose any secret values to the client bundle.
 */

export interface EnvConfig {
  appName: string;
  appUrl: string;
  supabaseUrl?: string;
  supabasePublishableKey?: string;
  aiProvider?: string;
  ollamaBaseUrl?: string;
}

function getEnv(): EnvConfig {
  return {
    appName:
      process.env.NEXT_PUBLIC_APP_NAME ?? "VALTORIX BD OS",
    appUrl:
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    aiProvider: process.env.AI_PROVIDER,
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
  };
}

export const env = getEnv();

/**
 * Returns whether Supabase is configured (Phase 1+).
 * Safe to call in client components.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabasePublishableKey);
}

/**
 * Returns whether a local AI provider is available (development only).
 * Ollama is not available in Vercel deployments.
 */
export function isLocalAIAvailable(): boolean {
  return env.aiProvider === "ollama" && Boolean(env.ollamaBaseUrl);
}
