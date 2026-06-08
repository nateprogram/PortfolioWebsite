// POST /api/applications/wipe
//
// Destructive: deletes ALL tracked applications and every secondary index.
// For a clean rebuild — wipe here, then run `resetBackfill` + `scanInbox` in
// the Apps Script so the tracker is rebuilt from scratch with current dedup
// logic (collapsing old per-thread duplicates).
//
// Cookie-gated like the rest of the tool. No body required.

import { cookies } from "next/headers";
import { isAuthorized } from "@/lib/resume-auth";
import { wipeAllApplications } from "@/lib/applications-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  if (!isAuthorized(await cookies())) {
    return jsonError(401, "Unauthorized.");
  }
  const removed = await wipeAllApplications();
  if (removed < 0) {
    return jsonError(503, "KV store not configured.");
  }
  return new Response(JSON.stringify({ removed }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
