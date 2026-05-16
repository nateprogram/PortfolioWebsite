// POST /api/resume/judge
//
// Runs the Groq judge pass on a draft resume. The client calls this
// after a successful generation + heuristic check; if the judge finds
// hard issues, the client kicks off a retry just like a heuristic
// failure.
//
// Auth: same resume_session cookie as the rest of /api/resume.
//
// Gating: bypassed entirely (returns empty issues) when
//   - GROQ_API_KEY is not set, OR
//   - ENABLE_JUDGE_PASS is set to "false" / "0".
// This lets the user kill the judge without redeploying if Groq has an
// outage.
//
// Request:  { jobDescription: string, markdown: string }
// Response: { issues: CheckIssue[] }

import { cookies } from "next/headers";
import { isAuthorized } from "@/lib/resume-auth";
import { judgeResume } from "@/lib/resume-judge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_JD_LEN = 12_000;
const MAX_MARKDOWN_LEN = 32_000;

function judgeEnabled(): boolean {
  if (!process.env.GROQ_API_KEY) return false;
  const flag = process.env.ENABLE_JUDGE_PASS?.toLowerCase();
  if (flag === "false" || flag === "0" || flag === "no") return false;
  return true;
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  if (!isAuthorized(cookieStore)) {
    return jsonError(401, "Unauthorized.");
  }

  if (!judgeEnabled()) {
    // Disabled — return empty issues so the client treats this as a
    // clean pass and doesn't loop on a missing-key error.
    return new Response(JSON.stringify({ issues: [], enabled: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Body must be JSON.");
  }
  const jd = (body as { jobDescription?: unknown })?.jobDescription;
  const md = (body as { markdown?: unknown })?.markdown;
  if (typeof jd !== "string" || typeof md !== "string") {
    return jsonError(
      400,
      "Body must include `jobDescription` and `markdown` strings.",
    );
  }
  const trimmedJd = jd.trim();
  const trimmedMd = md.trim();
  if (trimmedJd.length < 30) {
    return jsonError(400, "Job description is too short.");
  }
  if (trimmedJd.length > MAX_JD_LEN) {
    return jsonError(413, `Job description too long (>${MAX_JD_LEN} chars).`);
  }
  if (trimmedMd.length < 500) {
    return jsonError(
      400,
      "Markdown is too short to judge (was the generation truncated?).",
    );
  }
  if (trimmedMd.length > MAX_MARKDOWN_LEN) {
    return jsonError(413, `Markdown too long (>${MAX_MARKDOWN_LEN} chars).`);
  }

  const issues = await judgeResume({
    jobDescription: trimmedJd,
    markdown: trimmedMd,
  });

  return new Response(JSON.stringify({ issues, enabled: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
