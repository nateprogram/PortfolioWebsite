// GET /api/resume/history
//
// Returns the auth'd user's recent saved resumes (newest first), as
// metadata only. The full markdown body comes from /api/resume/[id].

import { cookies } from "next/headers";
import { isAuthorized } from "@/lib/resume-auth";
import { listResumes } from "@/lib/resume-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAuthorized(await cookies())) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const all = await listResumes(50);
  // Strip the full body to keep the list response small. The page only
  // needs the snippet + timestamp to render the row.
  const items = all.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    jobDescriptionSnippet: r.jobDescriptionSnippet,
  }));

  return new Response(JSON.stringify({ items }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
