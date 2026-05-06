// /tools/resume — server component that gates the tool behind the
// magic-URL unlock cookie. Visitors without a valid session see the
// recruiter-facing LockedView. The owner sees the Builder.
//
// First-time-on-a-device flow:
//   1. Owner visits /tools/resume?key=<RESUME_TOOL_KEY>
//   2. This component spots the `?key=` query param and forwards to
//      /api/resume/unlock?key=... (which validates, sets the cookie,
//      and redirects back here without the key in the URL).
//   3. On the next render the cookie is present and Builder renders.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAuthorized } from "@/lib/resume-auth";
import { Builder } from "./builder";
import { LockedView } from "./locked-view";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ key?: string | string[] }>;

export default async function ResumeToolPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const rawKey = params.key;
  const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;
  if (key) {
    // Hand off to the unlock route so the cookie gets set and the
    // secret leaves the URL bar via redirect.
    redirect(`/api/resume/unlock?key=${encodeURIComponent(key)}`);
  }

  const authed = isAuthorized(await cookies());
  return authed ? <Builder /> : <LockedView />;
}
