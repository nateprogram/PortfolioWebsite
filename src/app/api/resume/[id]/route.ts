// GET    /api/resume/[id]    fetch a saved resume (full markdown body)
// DELETE /api/resume/[id]    permanently delete it

import { cookies } from "next/headers";
import { isAuthorized } from "@/lib/resume-auth";
import { deleteResume, getResume } from "@/lib/resume-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isAuthorized(await cookies())) {
    return jsonError(401, "Unauthorized");
  }
  const { id } = await ctx.params;
  const resume = await getResume(id);
  if (!resume) return jsonError(404, "Not found");
  return new Response(JSON.stringify(resume), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isAuthorized(await cookies())) {
    return jsonError(401, "Unauthorized");
  }
  const { id } = await ctx.params;
  const ok = await deleteResume(id);
  if (!ok) return jsonError(500, "Delete failed (KV unreachable?).");
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
