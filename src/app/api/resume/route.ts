// POST /api/resume — generates a tailored resume.
//
// Auth: requires the resume_session cookie (see /api/resume/unlock).
// Request: { jobDescription, retry?: { previousAttempt, failureNotes } }
//   The retry field is set on auto-retry attempts so the model gets
//   explicit fix-feedback in the user message (system prompt rules
//   still apply).
// Response: streamed text/plain markdown — [META] block, then
//   `## ATS Keywords`, then `---`, then the resume body.
// Persistence: NOT auto-saved. Client POSTs accepted output to
//   /api/resume/save once the retry loop settles, so retry attempts
//   don't pollute history.

import { cookies } from "next/headers";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/resume/prompt";
import { isAuthorized } from "@/lib/resume-auth";
import { tryRoleStreaming } from "@/lib/ai";

// Run on Node, not Edge. The Gemini SDK is fine on Edge but Node makes
// debugging easier and avoids surprise compatibility regressions.
export const runtime = "nodejs";

// Block any kind of caching. Each call should hit Gemini fresh.
export const dynamic = "force-dynamic";

const MAX_JD_LEN = 12_000; // ~3K tokens. Larger JDs almost never help quality.
const MAX_PREV_ATTEMPT_LEN = 20_000; // ~5K tokens; retry payload upper bound
const MAX_FAILURE_NOTES_LEN = 4_000;

type RetryContext = {
  previousAttempt: string;
  failureNotes: string;
};

export async function POST(req: Request) {
  // 1. Auth — the magic-URL unlock route is the only way to get a cookie.
  const cookieStore = await cookies();
  if (!isAuthorized(cookieStore)) {
    return jsonError(
      401,
      "Unauthorized. Visit /api/resume/unlock?key=<RESUME_TOOL_KEY> to set the session cookie.",
    );
  }

  // 2. Env config is checked by the AI role chain. We fail fast here
  //    only if the primary drafter key is absent so the user gets a
  //    useful setup-time error rather than a deep stack trace.
  if (!process.env.GOOGLE_AI_API_KEY) {
    return jsonError(
      500,
      "Server is missing GOOGLE_AI_API_KEY. Add it to .env.local locally and to the Vercel project's Environment Variables for production.",
    );
  }

  // 3. Body parse + validate
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
    return jsonError(
      400,
      "Job description is too short. Paste at least a sentence or two.",
    );
  }
  if (trimmed.length > MAX_JD_LEN) {
    return jsonError(
      413,
      `Job description is too long (${trimmed.length} chars). Trim to ${MAX_JD_LEN} or fewer.`,
    );
  }

  // Optional retry context
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

  // 4. Dispatch via the `resume-drafter` role chain. Today this resolves
  //    to gemini-primary → gemini-backup (see src/lib/ai/roles.ts), but
  //    callers can swap providers via the AI_RESUME_DRAFTER_CHAIN env var
  //    without any code change.
  const userPrompt = retry
    ? buildRetryPrompt(trimmed, retry)
    : buildUserPrompt(trimmed);

  let streamResult;
  try {
    streamResult = await tryRoleStreaming("resume-drafter", (provider) =>
      provider.streamGenerate({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        // Slight temperature bump on retries to escape whatever local
        // attractor produced the failed first attempt.
        temperature: retry ? 0.55 : 0.4,
      }),
    );
  } catch (err) {
    return jsonError(
      502,
      `Drafter chain failed: ${(err as Error).message ?? "unknown error"}`,
    );
  }

  // 5. Pipe the provider's stream straight into the response. After the
  //    stream closes, finalize() gives us the provider's terminal
  //    metadata (finishReason, totalChars) for diagnostic logging.
  const encoder = new TextEncoder();
  let totalChunks = 0;
  let totalBytes = 0;
  const responseStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const text of streamResult.chunks) {
          if (text) {
            totalChunks++;
            totalBytes += text.length;
            controller.enqueue(encoder.encode(text));
          }
        }
      } catch (err) {
        const msg = (err as Error).message ?? "unknown";
        console.error(
          `[/api/resume] stream error after ${totalChunks} chunks / ${totalBytes} bytes:`,
          msg,
        );
        const note = `\n\n[stream error: ${msg}]\n`;
        controller.enqueue(encoder.encode(note));
      } finally {
        if (totalBytes < 2000) {
          // Short response. Likely SAFETY / RECITATION / MAX_TOKENS or a
          // provider-side cutoff. finalize() exposes the provider's
          // terminal metadata for diagnosis.
          let finishReason = "unknown";
          let providerName = "unknown";
          try {
            const final = await streamResult.finalize();
            finishReason = final.finishReason;
            providerName = final.providerName;
          } catch {
            /* ignore */
          }
          console.warn(
            `[/api/resume] short response from ${providerName}: ${totalChunks} chunks / ${totalBytes} bytes · finishReason=${finishReason}`,
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

/**
 * Append a "FIX FEEDBACK" addendum to the user-message. The system prompt
 * still owns all the rules; this just tells the model what its previous
 * attempt got wrong and asks for a fresh emit in the same format.
 *
 * Note: we deliberately do NOT echo the previous attempt back to the
 * model. Embedding the previous markdown caused Gemini Flash to
 * truncate the new response (likely because the previous attempt
 * contains its own `[META]…[/META]` and `---` markers that confuse the
 * model's stop-detection). The failure notes alone are enough signal
 * for the model to do better on retry, because the JD + corpus + rules
 * fully determine the target output.
 */
function buildRetryPrompt(jd: string, retry: RetryContext): string {
  const base = buildUserPrompt(jd);
  return `${base}

# FIX FEEDBACK (your previous attempt failed these specific quality checks)

${retry.failureNotes}

# INSTRUCTION

Generate a NEW resume from scratch in the same output format (META block + ATS Keywords + horizontal rule + resume body). The previous attempt is gone; do not reference it. Pay close attention to the checks above and produce output that passes every one of them. Apply every rule from the system prompt, especially the MOST-VIOLATED RULES at the top.`;
}

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
