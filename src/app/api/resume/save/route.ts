// POST /api/resume/save
//
// Persists an accepted resume markdown to KV. The client calls this
// once after /api/resume's auto-retry loop settles, so retry attempts
// don't pollute the History panel — only the final accepted output
// (or the best output if all retries failed) gets saved.
//
// Auth: same resume_session cookie as the rest of the resume API.
//
// Request:  { jobDescription: string, markdown: string }
// Response: { id: string | null }   (null if KV is not configured)

import { cookies } from "next/headers";
import { isAuthorized } from "@/lib/resume-auth";
import { saveResume } from "@/lib/resume-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_JD_LEN = 12_000;
const MAX_MARKDOWN_LEN = 32_000;

export async function POST(req: Request) {
  const cookieStore = await cookies();
  if (!isAuthorized(cookieStore)) {
    return jsonError(401, "Unauthorized.");
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
  if (trimmedMd.length < 100) {
    return jsonError(400, "Markdown payload is too short to save.");
  }
  if (trimmedMd.length > MAX_MARKDOWN_LEN) {
    return jsonError(413, `Markdown too long (>${MAX_MARKDOWN_LEN} chars).`);
  }

  const id = await saveResume({
    jobDescription: trimmedJd,
    markdown: trimmedMd,
  });

  return new Response(JSON.stringify({ id }), {
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
