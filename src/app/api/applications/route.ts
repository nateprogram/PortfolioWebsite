// GET /api/applications
//
// Lists tracked applications (newest first) for the spreadsheet view.
// Same auth as the rest of the tool — gated by the resume_session cookie.
//
// There is no POST here: applications are created by the Gmail ingest
// pipeline (POST /api/applications/ingest), not by hand. Per-row edits
// and deletes live on /api/applications/[id].

import { cookies } from "next/headers";
import { isAuthorized } from "@/lib/resume-auth";
import { listApplications } from "@/lib/applications-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAuthorized(await cookies())) {
    return jsonError(401, "Unauthorized.");
  }
  const items = await listApplications(500);
  return new Response(JSON.stringify({ items }), {
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
