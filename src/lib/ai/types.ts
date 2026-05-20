// SERVER-ONLY: shared types for the AI provider abstraction.
//
// Every provider (Gemini, Groq, OpenAI, Anthropic, …) implements the
// AIProvider interface. Callers don't care which underlying API they
// hit — they ask the registry for a provider by name and call
// `generate` (one-shot) or `streamGenerate` (streaming).

/** Provider options common to both streaming and one-shot calls. */
export type GenerateOptions = {
  /** Sticky directive — `systemInstruction` on Gemini, `system` role on OpenAI-compat. */
  systemPrompt: string;
  /** The actual user-turn content (corpus + JD + retry feedback, etc.). */
  userPrompt: string;
  /** 0–1. Lower = more deterministic. Default per-adapter. */
  temperature?: number;
  /** Output token budget. Note: Gemini 2.5 includes "thinking" tokens here. */
  maxOutputTokens?: number;
  /** Nucleus sampling. Default per-adapter. */
  topP?: number;
  /**
   * Force structured output. `"json"` enables JSON mode (Gemini's
   * `responseMimeType: application/json`; OpenAI-compat's
   * `response_format: { type: "json_object" }`). Not all providers
   * support it — adapters that don't will ignore this and the caller
   * needs to parse with a permissive fallback.
   */
  responseFormat?: "text" | "json";
  /**
   * Hard upper bound on wall-clock time. The adapter aborts the
   * underlying request when this elapses. Default: 60s.
   */
  timeoutMs?: number;
};

/** One-shot result. */
export type GenerateResult = {
  text: string;
  /** SDK-provided reason the model stopped (`STOP`, `MAX_TOKENS`, `SAFETY`, etc.). Normalized to lowercase string; "unknown" if the adapter couldn't determine. */
  finishReason: string;
  /** Set by the adapter; useful for logging. */
  providerName: string;
  /** Model identifier the adapter ended up using. */
  model: string;
};

/** Streaming result. The caller iterates `chunks` then awaits `finalize`. */
export type StreamResult = {
  /** Async iterable of plain-text chunks (already unwrapped from SSE / SDK shapes). */
  chunks: AsyncIterable<string>;
  /**
   * Resolves once the stream closes. Lets the caller get the same
   * metadata `GenerateResult` exposes after consuming the stream.
   */
  finalize: () => Promise<{
    finishReason: string;
    providerName: string;
    model: string;
    /** Total characters streamed. Cheap diagnostic. */
    totalChars: number;
  }>;
};

/** Adapter contract — implement once per provider family. */
export interface AIProvider {
  /** Short stable name, e.g. "gemini-primary", "groq", "openai". Used for logging. */
  readonly name: string;
  /** Model identifier the adapter will use by default. */
  readonly model: string;
  /** One-shot completion. Use for short structured outputs (judge, scorer, classifier). */
  generate(options: GenerateOptions): Promise<GenerateResult>;
  /** Streaming completion. Use for long user-facing outputs (drafter). */
  streamGenerate(options: GenerateOptions): Promise<StreamResult>;
}

/**
 * Standard error class adapters throw. Lets `tryProviders` decide
 * whether to advance to the next provider in the chain or surface
 * the error to the caller.
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly kind:
      | "auth" // missing/invalid API key
      | "rate_limit" // 429
      | "server_error" // 5xx, provider-side spike
      | "client_error" // 4xx (excluding 401/429)
      | "timeout" // exceeded timeoutMs
      | "network" // fetch threw before getting a response
      | "unsupported" // feature not supported by this provider (e.g. JSON mode)
      | "unknown",
    public readonly providerName: string,
    public readonly underlying?: unknown,
  ) {
    super(message);
    this.name = "ProviderError";
  }

  /** True when the role chain should advance to the next provider on this error. */
  get isRetryable(): boolean {
    return (
      this.kind === "rate_limit" ||
      this.kind === "server_error" ||
      this.kind === "timeout" ||
      this.kind === "network"
    );
  }
}
