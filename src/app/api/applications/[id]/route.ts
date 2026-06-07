// GET, PATCH, DELETE /api/applications/[id]
//
// Single-record endpoints for the application tracker. PATCH accepts
// any subset of the editable fields. Unknown fields are ignored
// silently so the client can be liberal.

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

  // Required-shape fields.
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

  // Optional string fields. We treat empty-after-trim as "clear this
  // field" by sending undefined, so the client can unset a value by
  // PATCHing with "".
  if ("appliedDate" in input)
    patch.appliedDate = coerceOptionalString(input.appliedDate);
  if ("deadline" in input)
    patch.deadline = coerceOptionalString(input.deadline);
  if ("jdUrl" in input) patch.jdUrl = coerceOptionalString(input.jdUrl);
  if ("rawJdText" in input)
    patch.rawJdText = coerceOptionalString(input.rawJdText);
  if ("location" in input)
    patch.location = coerceOptionalString(input.location);
  if ("experienceYears" in input)
    patch.experienceYears = coerceOptionalString(input.experienceYears);
  if ("notes" in input) patch.notes = coerceOptionalString(input.notes);
  if ("coverLetterMarkdown" in input)
    patch.coverLetterMarkdown = coerceOptionalString(input.coverLetterMarkdown);
  if ("resumeMarkdown" in input)
    patch.resumeMarkdown = coerceOptionalString(input.resumeMarkdown);
  if ("resumeId" in input)
    patch.resumeId = coerceOptionalString(input.resumeId);

  // Numeric fields.
  if ("salaryMin" in input)
    patch.salaryMin = coerceOptionalPositiveNumber(input.salaryMin);
  if ("salaryMax" in input)
    patch.salaryMax = coerceOptionalPositiveNumber(input.salaryMax);

  // Array fields.
  if ("requiredSkills" in input)
    patch.requiredSkills = coerceOptionalStringArray(input.requiredSkills);

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

function coerceOptionalString(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  return trimmed || undefined;
}

function coerceOptionalPositiveNumber(v: unknown): number | undefined {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0) return undefined;
  return v;
}

function coerceOptionalStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: string[] = [];
  for (const item of v) {
    if (typeof item === "string") {
      const t = item.trim();
      if (t) out.push(t);
    }
  }
  return out.length > 0 ? out : undefined;
}
