// GET /api/resume/unlock?key=<secret>
//
// One-time unlock for /tools/resume. Validates the query-string key
// against RESUME_TOOL_KEY (env), sets an HTTP-only cookie whose value
// is an HMAC of the secret, and redirects to /tools/resume so the
// secret leaves the URL bar.
//
// Wrong or missing key: 401 with a short message. No cookie set.

import { NextResponse } from "next/server";
import {
  RESUME_COOKIE_MAX_AGE,
  RESUME_COOKIE_NAME,
  buildSessionToken,
  isValidKey,
} from "@/lib/resume-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const provided = url.searchParams.get("key");

  if (!isValidKey(provided)) {
    return new NextResponse("Wrong key.", {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const token = buildSessionToken();
  if (!token) {
    // Should never happen if isValidKey returned true, but safe-guard.
    return new NextResponse("Server is missing RESUME_TOOL_KEY.", {
      status: 500,
    });
  }

  // Redirect to the clean tool URL so the secret disappears from history.
  const dest = new URL("/tools/resume", url.origin);
  const res = NextResponse.redirect(dest, 302);
  res.cookies.set({
    name: RESUME_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: RESUME_COOKIE_MAX_AGE,
  });
  return res;
}
