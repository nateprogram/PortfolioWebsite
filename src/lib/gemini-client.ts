// SERVER-ONLY: shared Gemini streaming client used by /api/resume and
// /api/cover-letter. Both endpoints want the same generation config,
// safety settings, and primary→backup key fallback behavior; this is
// the single place those are defined.

import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";

export type GeminiStreamResult = {
  stream: AsyncGenerator<{ text(): string }, void, unknown>;
  /** Untyped because the SDK's stream-result shape is awkward to express. Used only to read `candidates[0].finishReason` after the stream closes. */
  resultRef: unknown;
  /** Which key fulfilled the request, for diagnostic logging. */
  keyUsed: "primary" | "backup";
};

export type GeminiStreamOptions = {
  /** The system instruction the model treats as a sticky directive. */
  systemPrompt: string;
  /** The user message — corpus + JD + optional retry feedback. */
  userPrompt: string;
  /** When true the model is on a retry attempt; bump temperature slightly. */
  isRetry: boolean;
  /**
   * Override the output-token budget. Default 32768 leaves plenty of
   * headroom for Gemini 2.5 Flash's reasoning + a full resume; cover
   * letters could go lower but the cost is the same so we keep parity.
   */
  maxOutputTokens?: number;
};

/**
 * Start a streaming generation. Tries the primary API key first; if
 * that throws before any bytes are emitted (rate limit, 5xx, network
 * timeout), retries with the backup key when one is configured. Once
 * bytes are flowing the caller's responsible for surfacing mid-stream
 * errors — we can't rewind the response body.
 *
 * Returns the iterable stream and the SDK's result handle so the
 * caller can inspect `candidates[0].finishReason` after the stream
 * closes (lets us distinguish SAFETY/RECITATION/MAX_TOKENS from a
 * normal completion).
 */
export async function startGeminiStream(
  options: GeminiStreamOptions,
): Promise<GeminiStreamResult> {
  const primaryKey = process.env.GOOGLE_AI_API_KEY;
  const backupKey = process.env.GOOGLE_AI_API_KEY_BACKUP;
  if (!primaryKey) {
    throw new Error(
      "GOOGLE_AI_API_KEY is not set. Add it to .env.local and to Vercel env vars.",
    );
  }

  try {
    const r = await callGemini(primaryKey, options);
    return { ...r, keyUsed: "primary" };
  } catch (primaryErr) {
    if (!backupKey) throw primaryErr;
    console.warn(
      `[gemini-client] primary key failed: ${(primaryErr as Error).message}; trying backup.`,
    );
    try {
      const r = await callGemini(backupKey, options);
      console.log(`[gemini-client] serving from backup key`);
      return { ...r, keyUsed: "backup" };
    } catch (backupErr) {
      throw new Error(
        `Both Gemini keys failed. primary: ${(primaryErr as Error).message}; backup: ${(backupErr as Error).message}`,
      );
    }
  }
}

async function callGemini(
  apiKey: string,
  options: GeminiStreamOptions,
): Promise<Omit<GeminiStreamResult, "keyUsed">> {
  const genai = new GoogleGenerativeAI(apiKey);
  const model = genai.getGenerativeModel({
    // Google's auto-tracking alias for current stable Flash. Tends to
    // have better availability than pinned versions.
    model: "gemini-flash-latest",
    systemInstruction: options.systemPrompt,
    generationConfig: {
      temperature: options.isRetry ? 0.55 : 0.4,
      topP: 0.9,
      maxOutputTokens: options.maxOutputTokens ?? 32768,
    },
    // Resume / cover letter content embeds a real email + phone, which
    // Gemini's default safety thresholds sometimes flag as "dangerous
    // content" mid-stream. The input is the owner's own content so we
    // accept the trust trade-off and loosen all four categories.
    safetySettings: [
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
    ],
  });
  const result = await model.generateContentStream(options.userPrompt);
  return {
    stream: result.stream as AsyncGenerator<
      { text(): string },
      void,
      unknown
    >,
    resultRef: result,
  };
}
