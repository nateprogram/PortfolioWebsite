// GET, PATCH, DELETE /api/applications/[id]
//
// Single-record endpoints for the application tracker.

import { cookies } from "next/headers";
import { isAuthorized } from "@/lib/resume-auth";
import {
  APPLICATION_STATUSES,
  deleteApplication,
  getApplication,
  updateApplication,
  type ApplicationStatus,
  type ApplicationUpdate,
} from "@/lib/applications-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  if (!isAuthorized(await cookies())) {
    return jsonError(401, "Unauthorized.");
  }
  const { id } = await params;
  const item = await getApplication(id);
  if (!item) return jsonError(404, "Application not found.");
  return new Response(JSON.stringify({ item }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function PATCH(req: Request, { params }: Params) {
  if (!isAuthorized(await cookies())) {
    return jsonError(401, "Unauthorized.");
  }
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Body must be JSON.");
  }
  const input = body as Record<string, unknown>;
  const patch: ApplicationUpdate = {};
  if (typeof input.company === "string") patch.company = input.company.trim();
  if (typeof input.position === "string")
    patch.position = input.position.trim();
  if (typeof input.status === "string") {
    if (!(APPLICATION_STATUSES as string[]).includes(input.status)) {
      return jsonError(
        400,
        `Invalid status. Expected one of ${APPLICATION_STATUSES.join(", ")}.`,
      );
    }
    patch.status = input.status as ApplicationStatus;
  }
  if (typeof input.appliedDate === "string")
    patch.appliedDate = input.appliedDate || undefined;
  if (typeof input.jdUrl === "string") patch.jdUrl = input.jdUrl || undefined;
  if (typeof input.notes === "string") patch.notes = input.notes || undefined;
  if (typeof input.resumeId === "string")
    patch.resumeId = input.resumeId || undefined;

  const updated = await updateApplication(id, patch);
  if (!updated) return jsonError(404, "Application not found.");
  return new Response(JSON.stringify({ item: updated }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!isAuthorized(await cookies())) {
    return jsonError(401, "Unauthorized.");
  }
  const { id } = await params;
  const ok = await deleteApplication(id);
  if (!ok) return jsonError(404, "Application not found.");
  return new Response(JSON.stringify({ ok: true }), {
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
