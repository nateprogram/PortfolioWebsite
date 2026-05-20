// SERVER-ONLY: provider registry. The single place where API keys,
// base URLs, and default model names get mapped to concrete adapters.
//
// Adding a new provider = add one case to `getProvider`. The adapter
// itself usually doesn't need changes — most providers speak the
// OpenAI Chat Completions wire format and can use OpenAICompatProvider.

import { GeminiProvider } from "./gemini";
import { OpenAICompatProvider } from "./openai-compat";
import type { AIProvider } from "./types";

/**
 * Stable provider identifier. Add a new one here, then a case in
 * `getProvider` below. Anything outside this union should be a typo.
 */
export type ProviderName =
  // Google Gemini family (uses native SDK).
  | "gemini-primary"
  | "gemini-backup"
  // OpenAI-compatible providers (all use OpenAICompatProvider).
  | "groq" // Llama 3.3 70B etc. — free tier
  | "openai" // GPT-4, GPT-4o etc. — paid
  | "openrouter" // ~100 models on one key — mixed free/paid
  | "anthropic-openai-compat" // Claude via OpenAI-compat endpoint — paid
  | "cerebras" // Llama on Cerebras — fast, free tier
  | "mistral" // Mistral Le Plateforme — paid
  | "deepseek" // DeepSeek Chat / Coder — paid
  | "together"; // Together AI — paid

/**
 * Return a configured provider if its API key is set in env, otherwise
 * null. Callers should null-check and fall through to the next provider
 * in their role chain.
 *
 * Optional `modelOverride` swaps the default model — useful for trying
 * a cheaper or smaller variant without editing this file.
 */
export function getProvider(
  name: ProviderName,
  modelOverride?: string,
): AIProvider | null {
  switch (name) {
    case "gemini-primary": {
      const apiKey = process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) return null;
      return new GeminiProvider({
        name: "gemini-primary",
        apiKey,
        model: modelOverride ?? "gemini-flash-latest",
      });
    }
    case "gemini-backup": {
      const apiKey = process.env.GOOGLE_AI_API_KEY_BACKUP;
      if (!apiKey) return null;
      return new GeminiProvider({
        name: "gemini-backup",
        apiKey,
        model: modelOverride ?? "gemini-flash-latest",
      });
    }
    case "groq": {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) return null;
      return new OpenAICompatProvider({
        name: "groq",
        baseURL: "https://api.groq.com/openai/v1",
        apiKey,
        model: modelOverride ?? "llama-3.3-70b-versatile",
      });
    }
    case "openai": {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return null;
      return new OpenAICompatProvider({
        name: "openai",
        baseURL: "https://api.openai.com/v1",
        apiKey,
        model: modelOverride ?? "gpt-4o-mini",
      });
    }
    case "openrouter": {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) return null;
      return new OpenAICompatProvider({
        name: "openrouter",
        baseURL: "https://openrouter.ai/api/v1",
        apiKey,
        // Default to a free-tier model that's actually free. Override
        // when you want a paid one.
        model: modelOverride ?? "meta-llama/llama-3.3-70b-instruct:free",
        extraHeaders: {
          // OpenRouter likes (but doesn't require) these for analytics.
          "HTTP-Referer": "https://natewhite.dev",
          "X-Title": "natewhite.dev",
        },
      });
    }
    case "anthropic-openai-compat": {
      // Anthropic doesn't speak OpenAI's wire format natively — this is
      // a placeholder for if you ever proxy Claude through a translation
      // layer like Helicone. For direct Claude support, add a native
      // AnthropicProvider adapter using @anthropic-ai/sdk.
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) return null;
      return new OpenAICompatProvider({
        name: "anthropic-openai-compat",
        baseURL: "https://api.anthropic.com/v1",
        apiKey,
        model: modelOverride ?? "claude-3-5-haiku-latest",
      });
    }
    case "cerebras": {
      const apiKey = process.env.CEREBRAS_API_KEY;
      if (!apiKey) return null;
      return new OpenAICompatProvider({
        name: "cerebras",
        baseURL: "https://api.cerebras.ai/v1",
        apiKey,
        model: modelOverride ?? "llama-3.3-70b",
      });
    }
    case "mistral": {
      const apiKey = process.env.MISTRAL_API_KEY;
      if (!apiKey) return null;
      return new OpenAICompatProvider({
        name: "mistral",
        baseURL: "https://api.mistral.ai/v1",
        apiKey,
        model: modelOverride ?? "mistral-large-latest",
      });
    }
    case "deepseek": {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) return null;
      return new OpenAICompatProvider({
        name: "deepseek",
        baseURL: "https://api.deepseek.com/v1",
        apiKey,
        model: modelOverride ?? "deepseek-chat",
      });
    }
    case "together": {
      const apiKey = process.env.TOGETHER_API_KEY;
      if (!apiKey) return null;
      return new OpenAICompatProvider({
        name: "together",
        baseURL: "https://api.together.xyz/v1",
        apiKey,
        model: modelOverride ?? "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      });
    }
  }
}
