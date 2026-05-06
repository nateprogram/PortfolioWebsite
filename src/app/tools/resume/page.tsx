// /tools/resume — server component that gates the tool behind the
// magic-URL unlock cookie. Visitors without a valid session see the
// recruiter-facing LockedView. The owner sees the Builder.

import { cookies } from "next/headers";
import { isAuthorized } from "@/lib/resume-auth";
import { Builder } from "./builder";
import { LockedView } from "./locked-view";

export const dynamic = "force-dynamic";

export default async function ResumeToolPage() {
  const authed = isAuthorized(await cookies());
  return authed ? <Builder /> : <LockedView />;
}
