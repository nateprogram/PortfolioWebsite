// POST /api/resume
//
// Server-only route the /tools/resume page calls. Streams a tailored
// resume from Gemini back to the client as plain markdown.
//
// Auth: requires the resume_session cookie (set by /api/resume/unlock).
//       Without it the route returns 401 so anyone hitting the API
//       directly without going through the magic-URL unlock is blocked.
//
// Request:
//   {
//     jobDescription: string,
//     // Optional retry context — set on auto-retry attempts so the model
//     // gets explicit feedback on what to fix relative to the previous
//     // try. When present, the system prompt's rules still apply; the
//     // retry feedback is appended to the user message as an addendum.
//     retry?: {
//       previousAttempt: string;
//       failureNotes: string;  // pre-formatted, ready to paste
//     }
//   }
//
// Response: streamed text/plain markdown shaped like
//             [META]
//             company: ...
//             position: ...
//             [/META]
//             ## ATS Keywords
//             - ...
//             ---
//             # NATE WHITE
//             ...resume...
//
// Persistence: this route does NOT auto-save anymore. The client is
// responsible for POSTing the accepted output to /api/resume/save after
// the auto-retry loop settles. This keeps retry attempts out of history.

import { cookies } from "next/headers";
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/resume-prompt";
import { isAuthorized } from "@/lib/resume-auth";

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

  // 2. Env config
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
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

  // 4. Dispatch to Gemini
  let stream: AsyncGenerator<{ text(): string }, void, unknown>;
  // Keep the result handle so we can inspect candidates[0].finishReason
  // after the stream closes — that's how we tell SAFETY / RECITATION /
  // MAX_TOKENS apart from a real completion. Typed as `unknown` plus
  // narrowing at use because the older SDK's stream-result shape is
  // awkward to express precisely and this is diagnostic-only.
  let resultRef: unknown = null;
  try {
    const genai = new GoogleGenerativeAI(apiKey);
    const model = genai.getGenerativeModel({
      // Google's auto-tracking alias for current stable Flash. Tends to
      // have better availability than pinned versions. As of 2026 the
      // pinned `gemini-2.0-flash` is zero-quota'd on the free tier, and
      // pinned `gemini-2.5-flash` 503s during peak load.
      model: "gemini-flash-latest",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        // Slightly higher temperature on retries to escape the local
        // attractor that produced the failed output the first time.
        // Still tight enough to keep framing stable.
        temperature: retry ? 0.55 : 0.4,
        topP: 0.9,
        // Gemini 2.5 Flash counts internal "thinking" tokens against
        // this budget. With the older 4096 cap it was burning the
        // whole budget on reasoning, hitting MAX_TOKENS before emitting
        // any usable output (finishReason=MAX_TOKENS, 0 visible chars).
        // 32768 leaves plenty of headroom for thinking (~20K) plus a
        // full ~6KB resume (~1500 tokens of visible output).
        maxOutputTokens: 32768,
      },
      // Resume content embeds a real email + phone, which Gemini's default
      // safety thresholds sometimes flag as "dangerous content" mid-stream
      // and terminate the response. Loosen all four categories to BLOCK_NONE
      // for this route — the input is a JD from the owner of the resume,
      // so we accept the trust trade-off.
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
    const userPrompt = retry
      ? buildRetryPrompt(trimmed, retry)
      : buildUserPrompt(trimmed);
    const result = await model.generateContentStream(userPrompt);
    stream = result.stream as AsyncGenerator<{ text(): string }, void, unknown>;
    resultRef = result;
  } catch (err) {
    return jsonError(
      502,
      `Failed to call Gemini API: ${(err as Error).message ?? "unknown error"}`,
    );
  }

  // 5. Pipe Gemini's stream straight into the response. We log when the
  //    stream terminates with less than the expected resume size so we
  //    can spot SDK / safety / 503 issues from the dev log.
  const encoder = new TextEncoder();
  let totalChunks = 0;
  let totalBytes = 0;
  const responseStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.text();
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
          // Probe finishReason so we know whether this was SAFETY,
          // RECITATION, MAX_TOKENS, or something else.
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
            `[/api/resume] short response: ${totalChunks} chunks / ${totalBytes} bytes · finishReason=${finishReason}`,
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
