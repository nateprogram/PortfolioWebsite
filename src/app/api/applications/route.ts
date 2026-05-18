// GET, POST /api/applications
//
// Collection endpoints for the application tracker. Same auth as the
// resume tool — gated by the resume_session cookie.
//
// GET   → { items: Application[] } (newest first)
// POST  → { item: Application } | { error }

import { cookies } from "next/headers";
import { isAuthorized } from "@/lib/resume-auth";
import {
  APPLICATION_STATUSES,
  createApplication,
  listApplications,
  type ApplicationStatus,
} from "@/lib/applications-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAuthorized(await cookies())) {
    return jsonError(401, "Unauthorized.");
  }
  const items = await listApplications(200);
  return new Response(JSON.stringify({ items }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

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
  const company = typeof input.company === "string" ? input.company.trim() : "";
  const position =
    typeof input.position === "string" ? input.position.trim() : "";
  if (!company || !position) {
    return jsonError(400, "`company` and `position` are required.");
  }
  const statusRaw = input.status;
  const status: ApplicationStatus | undefined =
    typeof statusRaw === "string" &&
    (APPLICATION_STATUSES as string[]).includes(statusRaw)
      ? (statusRaw as ApplicationStatus)
      : undefined;
  const item = await createApplication({
    company,
    position,
    status,
    appliedDate:
      typeof input.appliedDate === "string" ? input.appliedDate : undefined,
    jdUrl: typeof input.jdUrl === "string" ? input.jdUrl : undefined,
    notes: typeof input.notes === "string" ? input.notes : undefined,
    resumeId:
      typeof input.resumeId === "string" ? input.resumeId : undefined,
  });
  if (!item) {
    return jsonError(
      503,
      "Application could not be saved. Is the KV store configured?",
    );
  }
  return new Response(JSON.stringify({ item }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
