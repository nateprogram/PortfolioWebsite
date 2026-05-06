// POST /api/resume
//
// Server-only route the /tools/resume page calls. Streams a tailored
// resume from Gemini back to the client as plain markdown.
//
// Auth: requires the resume_session cookie (set by /api/resume/unlock).
//       Without it the route returns 401 so anyone hitting the API
//       directly without going through the magic-URL unlock is blocked.
//
// Request:  { jobDescription: string }
// Response: streamed text/plain markdown shaped like
//             ## ATS Keywords
//             - ...
//             ---
//             # NATE WHITE
//             ...resume...
//
// On the way in: validate, auth, dispatch to Gemini.
// On the way out: tee the stream so we can save the full markdown to KV
//                 once the response closes.

import { cookies } from "next/headers";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/resume-prompt";
import { isAuthorized } from "@/lib/resume-auth";
import { saveResume } from "@/lib/resume-store";

// Run on Node, not Edge. The Gemini SDK is fine on Edge but Node makes
// debugging easier and avoids surprise compatibility regressions.
export const runtime = "nodejs";

// Block any kind of caching. Each call should hit Gemini fresh.
export const dynamic = "force-dynamic";

const MAX_JD_LEN = 12_000; // ~3K tokens. Larger JDs almost never help quality.

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

  // 4. Dispatch to Gemini
  let stream: AsyncGenerator<{ text(): string }, void, unknown>;
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
        temperature: 0.4, // tight, predictable; resume framing isn't creative writing
        topP: 0.9,
        maxOutputTokens: 4096,
      },
    });
    const result = await model.generateContentStream(buildUserPrompt(trimmed));
    stream = result.stream as AsyncGenerator<{ text(): string }, void, unknown>;
  } catch (err) {
    return jsonError(
      502,
      `Failed to call Gemini API: ${(err as Error).message ?? "unknown error"}`,
    );
  }

  // 5. Pipe Gemini's stream into the response. Tee into a buffer so we
  //    can persist the full markdown to KV after the stream closes,
  //    without holding up the user-facing response.
  const encoder = new TextEncoder();
  let accumulated = "";
  const responseStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.text();
          if (text) {
            accumulated += text;
            controller.enqueue(encoder.encode(text));
          }
        }
      } catch (err) {
        const note = `\n\n[stream error: ${(err as Error).message ?? "unknown"}]\n`;
        accumulated += note;
        controller.enqueue(encoder.encode(note));
      } finally {
        controller.close();
        // Fire-and-forget. saveResume() never throws (logs warnings).
        // We do NOT await because we don't want KV latency on the hot
        // path; the response is already done by the time we get here.
        void saveResume({
          jobDescription: trimmed,
          markdown: accumulated,
        });
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

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
