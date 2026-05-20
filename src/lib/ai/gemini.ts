// SERVER-ONLY: Google Gemini adapter for the AI provider abstraction.
//
// Uses the native @google/generative-ai SDK. Streaming uses
// `generateContentStream` (returns an async iterable); one-shot uses
// `generateContent`. Safety settings loosened to BLOCK_NONE because
// resume content embeds the owner's real phone/email which Gemini's
// default thresholds sometimes flag as "dangerous content".

import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";
import {
  ProviderError,
  type AIProvider,
  type GenerateOptions,
  type GenerateResult,
  type StreamResult,
} from "./types";

const DEFAULT_TIMEOUT_MS = 60_000;

const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

export class GeminiProvider implements AIProvider {
  readonly name: string;
  readonly model: string;
  private readonly apiKey: string;

  constructor(opts: { name: string; apiKey: string; model: string }) {
    this.name = opts.name;
    this.model = opts.model;
    this.apiKey = opts.apiKey;
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const model = this.buildModel(options);
    try {
      const result = await this.withTimeout(
        model.generateContent(options.userPrompt),
        options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      );
      const text = result.response.text();
      const finishReason =
        result.response.candidates?.[0]?.finishReason?.toLowerCase() ??
        "unknown";
      return {
        text,
        finishReason,
        providerName: this.name,
        model: this.model,
      };
    } catch (err) {
      throw this.normalizeError(err);
    }
  }

  async streamGenerate(options: GenerateOptions): Promise<StreamResult> {
    const model = this.buildModel(options);
    let result: Awaited<ReturnType<typeof model.generateContentStream>>;
    try {
      result = await this.withTimeout(
        model.generateContentStream(options.userPrompt),
        options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      );
    } catch (err) {
      throw this.normalizeError(err);
    }

    const providerName = this.name;
    const model_ = this.model;
    let totalChars = 0;

    const chunks: AsyncIterable<string> = {
      [Symbol.asyncIterator]() {
        const iter = result.stream[Symbol.asyncIterator]();
        return {
          async next(): Promise<IteratorResult<string>> {
            const r = await iter.next();
            if (r.done) return { value: "", done: true };
            const text = r.value.text();
            totalChars += text.length;
            return { value: text, done: false };
          },
        };
      },
    };

    const finalize = async () => {
      // Awaiting result.response after the stream is fully consumed
      // yields the SDK's terminal metadata.
      let finishReason = "unknown";
      try {
        const resp = await result.response;
        finishReason =
          resp.candidates?.[0]?.finishReason?.toLowerCase() ?? "unknown";
      } catch {
        /* swallow; we'll report "unknown" */
      }
      return {
        finishReason,
        providerName,
        model: model_,
        totalChars,
      };
    };

    return { chunks, finalize };
  }

  // ----- internals --------------------------------------------------------

  private buildModel(options: GenerateOptions) {
    const genai = new GoogleGenerativeAI(this.apiKey);
    return genai.getGenerativeModel({
      model: this.model,
      systemInstruction: options.systemPrompt,
      generationConfig: {
        temperature: options.temperature ?? 0.4,
        topP: options.topP ?? 0.9,
        maxOutputTokens: options.maxOutputTokens ?? 32768,
        ...(options.responseFormat === "json"
          ? { responseMimeType: "application/json" }
          : {}),
      },
      safetySettings: SAFETY_SETTINGS,
    });
  }

  private async withTimeout<T>(p: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new ProviderError(
              `Gemini call timed out after ${timeoutMs}ms`,
              "timeout",
              this.name,
            ),
          ),
        timeoutMs,
      );
    });
    try {
      return await Promise.race([p, timeout]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private normalizeError(err: unknown): ProviderError {
    if (err instanceof ProviderError) return err;
    const msg = (err as Error)?.message ?? String(err);
    // Gemini SDK errors are strings like "[GoogleGenerativeAI Error]: …
    // [503 Service Unavailable] …" — sniff the HTTP code.
    if (/\b429\b/.test(msg))
      return new ProviderError(msg, "rate_limit", this.name, err);
    if (/\b5\d\d\b/.test(msg))
      return new ProviderError(msg, "server_error", this.name, err);
    if (/\b401\b|\bAPI key\b/i.test(msg))
      return new ProviderError(msg, "auth", this.name, err);
    if (/\b4\d\d\b/.test(msg))
      return new ProviderError(msg, "client_error", this.name, err);
    if (/fetch failed|network|ECONN/i.test(msg))
      return new ProviderError(msg, "network", this.name, err);
    return new ProviderError(msg, "unknown", this.name, err);
  }
}
