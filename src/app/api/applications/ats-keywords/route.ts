// POST /api/applications/ats-keywords
//
// Takes a job description (pasted text or a URL) and returns the ATS
// keywords ranked by importance, each flagged with whether it already
// appears in Nate's resume.
//
// Auth: the resume_session cookie (same as the rest of the tool).
//
// Request:  { text?: string, url?: string }   (one of the two)
// Response: { keywords: KeywordHit[], missingCount: number } | { error }

import { cookies } from "next/headers";
import { isAuthorized } from "@/lib/resume-auth";
import { fetchJdText } from "@/lib/jd-fetcher";
import {
  analyzeAgainstResume,
  extractAtsKeywords,
} from "@/lib/ats-keywords";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isAuthorized(await cookies())) {
    return jsonError(401, "Unauthorized.");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Body must be JSON.");
  }
  const input = body as Record<string, unknown>;
  const text = typeof input.text === "string" ? input.text.trim() : "";
  const url = typeof input.url === "string" ? input.url.trim() : "";

  if (!text && !url) {
    return jsonError(400, "Provide either `text` (the JD) or `url`.");
  }

  // Resolve the JD text: pasted text wins; otherwise fetch the URL.
  let jdText = text;
  if (!jdText && url) {
    const fetched = await fetchJdText(url);
    if (!fetched.ok) {
      return jsonError(fetched.status, fetched.error);
    }
    jdText = fetched.text;
  }

  if (jdText.length < 50) {
    return jsonError(
      422,
      "That JD is too short to extract keywords from. Paste the full posting.",
    );
  }

  const keywords = await extractAtsKeywords(jdText);
  if (keywords.length === 0) {
    return jsonError(
      502,
      "Couldn't extract keywords (the AI provider may be down or rate-limited). Try again.",
    );
  }

  const analyzed = analyzeAgainstResume(keywords);
  const missingCount = analyzed.filter((k) => !k.inResume).length;

  return new Response(
    JSON.stringify({ keywords: analyzed, missingCount }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    },
  );
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
