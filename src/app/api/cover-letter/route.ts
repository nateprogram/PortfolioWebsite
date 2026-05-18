// POST /api/cover-letter
//
// Streams a tailored cover letter from Gemini. Mirrors /api/resume in
// shape:
//   - same auth (resume_session cookie)
//   - same fallback-key chain
//   - same retry-context plumbing (the client's auto-retry loop posts
//     `retry: { previousAttempt, failureNotes }` on subsequent attempts)
// Different system prompt and a much smaller output (200-300 words).
//
// Persistence is the client's job — cover letters aren't saved to the
// history list right now; the user downloads and moves on.

import { cookies } from "next/headers";
import { isAuthorized } from "@/lib/resume-auth";
import { startGeminiStream } from "@/lib/gemini-client";
import {
  COVER_LETTER_SYSTEM_PROMPT,
  buildCoverLetterUserPrompt,
  buildCoverLetterRetryPrompt,
} from "@/lib/cover-letter-prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_JD_LEN = 12_000;
const MAX_PREV_ATTEMPT_LEN = 8_000;
const MAX_FAILURE_NOTES_LEN = 4_000;

type RetryContext = {
  previousAttempt: string;
  failureNotes: string;
};

export async function POST(req: Request) {
  const cookieStore = await cookies();
  if (!isAuthorized(cookieStore)) {
    return jsonError(401, "Unauthorized.");
  }

  if (!process.env.GOOGLE_AI_API_KEY) {
    return jsonError(
      500,
      "Server is missing GOOGLE_AI_API_KEY. Add it to .env.local locally and to Vercel for production.",
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Body must be JSON.");
  }

  const jd = (body as { jobDescription?: unknown })?.jobDescription;
  if (typeof jd !== "string") {
    return jsonError(400, "Body must include a `jobDescription` string.");
  }
  const trimmed = jd.trim();
  if (trimmed.length < 30) {
    return jsonError(400, "Job description is too short.");
  }
  if (trimmed.length > MAX_JD_LEN) {
    return jsonError(413, `Job description is too long (>${MAX_JD_LEN} chars).`);
  }

  // Optional retry context.
  const retryRaw = (body as { retry?: unknown })?.retry;
  let retry: RetryContext | null = null;
  if (retryRaw && typeof retryRaw === "object") {
    const r = retryRaw as { previousAttempt?: unknown; failureNotes?: unknown };
    if (
      typeof r.previousAttempt === "string" &&
      typeof r.failureNotes === "string"
    ) {
      retry = {
        previousAttempt: r.previousAttempt.slice(0, MAX_PREV_ATTEMPT_LEN),
        failureNotes: r.failureNotes.slice(0, MAX_FAILURE_NOTES_LEN),
      };
    }
  }

  const userPrompt = retry
    ? buildCoverLetterRetryPrompt(trimmed, retry.failureNotes)
    : buildCoverLetterUserPrompt(trimmed);

  let stream: AsyncGenerator<{ text(): string }, void, unknown>;
  let resultRef: unknown = null;
  try {
    const result = await startGeminiStream({
      systemPrompt: COVER_LETTER_SYSTEM_PROMPT,
      userPrompt,
      isRetry: Boolean(retry),
      // Cover letters are short; lower the token budget slightly so
      // Gemini's thinking phase doesn't eat the whole budget for a
      // 300-word output. 16384 is still well above the 1500-token
      // visible-output target.
      maxOutputTokens: 16384,
    });
    stream = result.stream;
    resultRef = result.resultRef;
  } catch (err) {
    return jsonError(
      502,
      `Failed to call Gemini API: ${(err as Error).message ?? "unknown error"}`,
    );
  }

  const encoder = new TextEncoder();
  let totalBytes = 0;
  const responseStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.text();
          if (text) {
            totalBytes += text.length;
            controller.enqueue(encoder.encode(text));
          }
        }
      } catch (err) {
        const msg = (err as Error).message ?? "unknown";
        console.error(`[/api/cover-letter] stream error:`, msg);
        controller.enqueue(encoder.encode(`\n\n[stream error: ${msg}]\n`));
      } finally {
        if (totalBytes < 500) {
          let finishReason = "unknown";
          try {
            type ResultLike = {
              response: Promise<{
                candidates?: Array<{ finishReason?: string }>;
              }>;
            };
            const ref = resultRef as ResultLike | null;
            const resp = await ref?.response;
            finishReason = resp?.candidates?.[0]?.finishReason ?? "unknown";
          } catch {
            // ignore
          }
          console.warn(
            `[/api/cover-letter] short response: ${totalBytes} bytes · finishReason=${finishReason}`,
          );
        }
        controller.close();
      }
    },
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
