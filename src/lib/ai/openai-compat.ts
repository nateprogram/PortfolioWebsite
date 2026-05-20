// SERVER-ONLY: generic OpenAI Chat Completions adapter.
//
// Works for any provider that speaks the `/v1/chat/completions` API:
//   - Groq            https://api.groq.com/openai/v1
//   - OpenAI          https://api.openai.com/v1
//   - OpenRouter      https://openrouter.ai/api/v1
//   - Together        https://api.together.xyz/v1
//   - Cerebras        https://api.cerebras.ai/v1
//   - Mistral         https://api.mistral.ai/v1
//   - DeepSeek        https://api.deepseek.com/v1
//   - …any other compatible endpoint
//
// Adding a new compatible provider = one entry in registry.ts; this
// adapter doesn't need to change.

import {
  ProviderError,
  type AIProvider,
  type GenerateOptions,
  type GenerateResult,
  type StreamResult,
} from "./types";

const DEFAULT_TIMEOUT_MS = 60_000;

export type OpenAICompatOptions = {
  name: string;
  baseURL: string;
  apiKey: string;
  model: string;
  /** Optional extra headers (e.g., OpenRouter's `HTTP-Referer`). */
  extraHeaders?: Record<string, string>;
};

export class OpenAICompatProvider implements AIProvider {
  readonly name: string;
  readonly model: string;
  private readonly baseURL: string;
  private readonly apiKey: string;
  private readonly extraHeaders: Record<string, string>;

  constructor(opts: OpenAICompatOptions) {
    this.name = opts.name;
    this.model = opts.model;
    this.baseURL = opts.baseURL.replace(/\/+$/, ""); // trim trailing slash
    this.apiKey = opts.apiKey;
    this.extraHeaders = opts.extraHeaders ?? {};
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const body = this.buildBody(options, /* stream */ false);
    const res = await this.post(body, options.timeoutMs);
    let json: unknown;
    try {
      json = await res.json();
    } catch {
      throw new ProviderError(
        "Provider returned non-JSON body",
        "server_error",
        this.name,
      );
    }
    const choice = (json as { choices?: Array<{ message?: { content?: string }; finish_reason?: string }> })
      .choices?.[0];
    const text = choice?.message?.content ?? "";
    const finishReason = choice?.finish_reason?.toLowerCase() ?? "unknown";
    return {
      text,
      finishReason,
      providerName: this.name,
      model: this.model,
    };
  }

  async streamGenerate(options: GenerateOptions): Promise<StreamResult> {
    const body = this.buildBody(options, /* stream */ true);
    const res = await this.post(body, options.timeoutMs);
    if (!res.body) {
      throw new ProviderError(
        "Provider returned no response body for stream",
        "server_error",
        this.name,
      );
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let totalChars = 0;
    let finishReason = "unknown";
    const providerName = this.name;
    const model_ = this.model;

    // SSE parser: provider sends `data: {…}\n\n` lines. The terminal
    // line is `data: [DONE]`. Each JSON payload has a `choices[0].delta.content`
    // we accumulate, plus an optional `choices[0].finish_reason`.
    const chunks: AsyncIterable<string> = {
      [Symbol.asyncIterator]() {
        let buffer = "";
        let done = false;
        return {
          async next(): Promise<IteratorResult<string>> {
            while (!done) {
              const r = await reader.read();
              if (r.done) {
                done = true;
                break;
              }
              buffer += decoder.decode(r.value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";
              for (const rawLine of lines) {
                const line = rawLine.trim();
                if (!line.startsWith("data:")) continue;
                const payload = line.slice("data:".length).trim();
                if (payload === "[DONE]") {
                  done = true;
                  break;
                }
                try {
                  const obj = JSON.parse(payload) as {
                    choices?: Array<{
                      delta?: { content?: string };
                      finish_reason?: string;
                    }>;
                  };
                  const choice = obj.choices?.[0];
                  if (choice?.finish_reason) {
                    finishReason = choice.finish_reason.toLowerCase();
                  }
                  const piece = choice?.delta?.content;
                  if (piece) {
                    totalChars += piece.length;
                    return { value: piece, done: false };
                  }
                } catch {
                  // ignore malformed payload; keep reading
                }
              }
            }
            return { value: "", done: true };
          },
        };
      },
    };

    const finalize = async () => ({
      finishReason,
      providerName,
      model: model_,
      totalChars,
    });

    return { chunks, finalize };
  }

  // ----- internals --------------------------------------------------------

  private buildBody(options: GenerateOptions, stream: boolean) {
    const body: Record<string, unknown> = {
      model: this.model,
      messages: [
        { role: "system", content: options.systemPrompt },
        { role: "user", content: options.userPrompt },
      ],
      temperature: options.temperature ?? 0.4,
      top_p: options.topP ?? 0.9,
      max_tokens: options.maxOutputTokens ?? 4096,
      stream,
    };
    if (options.responseFormat === "json") {
      body.response_format = { type: "json_object" };
    }
    return body;
  }

  private async post(body: unknown, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          ...this.extraHeaders,
        },
        signal: controller.signal,
        body: JSON.stringify(body),
      });
    } catch (err) {
      clearTimeout(timer);
      if ((err as Error).name === "AbortError") {
        throw new ProviderError(
          `${this.name} timed out after ${timeoutMs}ms`,
          "timeout",
          this.name,
        );
      }
      throw new ProviderError(
        `${this.name} network error: ${(err as Error).message}`,
        "network",
        this.name,
        err,
      );
    }
    clearTimeout(timer);

    if (res.ok) return res;
    const bodyText = await res.text().catch(() => "");
    const trimmed = bodyText.slice(0, 240);
    if (res.status === 401)
      throw new ProviderError(
        `${this.name} 401: ${trimmed}`,
        "auth",
        this.name,
      );
    if (res.status === 429)
      throw new ProviderError(
        `${this.name} 429: ${trimmed}`,
        "rate_limit",
        this.name,
      );
    if (res.status >= 500)
      throw new ProviderError(
        `${this.name} ${res.status}: ${trimmed}`,
        "server_error",
        this.name,
      );
    throw new ProviderError(
      `${this.name} ${res.status}: ${trimmed}`,
      "client_error",
      this.name,
    );
  }
}
