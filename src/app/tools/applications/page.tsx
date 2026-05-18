// /tools/applications — application tracker.
//
// Same auth gate as /tools/resume: visit with `?key=<RESUME_TOOL_KEY>`
// once per device to set the resume_session cookie, then come back to
// the bare URL. Without the cookie, the page redirects to the resume
// tool so the user can unlock there.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAuthorized } from "@/lib/resume-auth";
import { ApplicationsClient } from "./applications-client";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ key?: string | string[] }>;

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const rawKey = params.key;
  const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;
  if (key) {
    // Hand off to the existing unlock route which already sets the
    // shared cookie and redirects back.
    redirect(`/api/resume/unlock?key=${encodeURIComponent(key)}`);
  }
  const authed = isAuthorized(await cookies());
  if (!authed) {
    // No public-facing locked view for this tool — just bounce the
    // visitor to the resume page which has its own unlock UI.
    redirect("/tools/resume");
  }
  return <ApplicationsClient />;
}
