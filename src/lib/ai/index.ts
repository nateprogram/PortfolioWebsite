// SERVER-ONLY: public entrypoint for the AI provider abstraction.
//
// Callers should import from `@/lib/ai` rather than reaching into the
// adapter files directly. Two main helpers:
//
//   tryRole(role, action)
//     Walk the role's provider chain. Run `action` with the first
//     provider whose API key is configured. If the provider throws
//     a retryable error (rate limit, 5xx, timeout, network), advance
//     to the next provider in the chain and retry. Throws when the
//     chain is exhausted or hits a non-retryable error.
//
//   getProvider(name, modelOverride?)
//     Direct access to a specific provider (for the rare case you
//     don't want chain fallback). Returns null if its API key isn't
//     set in env.
//
// See README.md in this directory for the full architecture map and
// how to add a new provider.

import { getProvider, type ProviderName } from "./registry";
import { chainFor, type AIRole } from "./roles";
import { ProviderError, type AIProvider } from "./types";

export { getProvider, type ProviderName } from "./registry";
export { chainFor, type AIRole } from "./roles";
export {
  ProviderError,
  type AIProvider,
  type GenerateOptions,
  type GenerateResult,
  type StreamResult,
} from "./types";

/**
 * Walk the chain for a role until one provider succeeds or all fail.
 * Errors from one provider don't bubble up unless they're
 * non-retryable (auth, client error, unsupported feature) — in which
 * case we stop, since the next provider would just be a guess.
 *
 * Use this for one-shot calls. For streaming, prefer
 * `tryRoleStreaming` so the caller can hand the stream to the client
 * before the inner work is finished.
 */
export async function tryRole<T>(
  role: AIRole,
  action: (provider: AIProvider) => Promise<T>,
): Promise<T> {
  const chain = chainFor(role);
  const errors: string[] = [];
  for (const name of chain) {
    const p = getProvider(name);
    if (!p) {
      errors.push(`${name}: api key not configured`);
      continue;
    }
    try {
      return await action(p);
    } catch (err) {
      const msg = (err as Error).message ?? String(err);
      errors.push(`${name}: ${msg}`);
      if (err instanceof ProviderError && !err.isRetryable) {
        // Fail fast on auth / client / unsupported errors.
        throw new Error(
          `[ai/${role}] non-retryable failure on ${name}: ${msg}`,
        );
      }
      // Retryable — log and advance to the next provider.
      console.warn(`[ai/${role}] ${name} failed (${msg}); trying next.`);
    }
  }
  throw new Error(
    `[ai/${role}] all providers in chain failed: ${errors.join(" | ")}`,
  );
}

/** Same shape as tryRole, but the action returns a StreamResult. */
export async function tryRoleStreaming<T>(
  role: AIRole,
  action: (provider: AIProvider) => Promise<T>,
): Promise<T> {
  // Streaming chains are identical to one-shot chains. Kept as a
  // distinct named export so call sites read intentionally.
  return tryRole(role, action);
}

/** Diagnostic: which providers are currently usable. Useful for a /api/_ai-status route. */
export function listConfiguredProviders(): ProviderName[] {
  const all: ProviderName[] = [
    "gemini-primary",
    "gemini-backup",
    "groq",
    "openai",
    "openrouter",
    "anthropic-openai-compat",
    "cerebras",
    "mistral",
    "deepseek",
    "together",
  ];
  return all.filter((n) => getProvider(n) !== null);
}
