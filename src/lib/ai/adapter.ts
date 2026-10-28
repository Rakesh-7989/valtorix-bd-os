import type { AIProvider as AIProviderType } from "./provider";
import { MockAIProvider } from "./mock-provider";
import { OllamaProvider } from "./ollama-provider";

/**
 * AI Provider Adapter — selects the right provider based on configuration.
 *
 * Priority:
 * 1. AI_PROVIDER=ollama → use OllamaProvider (if available, falls back to mock)
 * 2. AI_PROVIDER=mock → use MockAIProvider
 * 3. Default → use MockAIProvider (safe default)
 *
 * Ollama is only available locally (Vercel cannot reach localhost:11434).
 */

let cachedProvider: AIProviderType | null = null;

export function getAIProvider(): AIProviderType {
  if (cachedProvider) {
    return cachedProvider;
  }

  const aiProvider = process.env.AI_PROVIDER ?? "mock";

  if (aiProvider === "ollama") {
    const ollama = new OllamaProvider();
    cachedProvider = ollama;
    return ollama;
  }

  cachedProvider = new MockAIProvider();
  return cachedProvider;
}

export async function getAvailableAIProvider(): Promise<AIProviderType> {
  const provider = getAIProvider();
  const available = await provider.isAvailable();

  if (!available && provider.name === "ollama") {
    // Ollama not available — fall back to mock
    cachedProvider = new MockAIProvider();
    return cachedProvider;
  }

  return provider;
}

export type { AIProviderType as AIProvider };
