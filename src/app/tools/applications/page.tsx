// /tools/applications — the job tracker (ATS keyword tool + Gmail-fed
// spreadsheet). Gated behind the magic-URL unlock cookie.
//
// First-time-on-a-device flow:
//   1. Visit /tools/applications?key=<RESUME_TOOL_KEY>
//   2. This forwards to /api/resume/unlock?key=... which validates the
//      key, sets the 90-day cookie, and redirects back here clean.
//   3. On the next render the cookie is present and the client renders.
//
// Visitors without the cookie see the small LockedView below.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Target, Mail } from "lucide-react";
import { isAuthorized } from "@/lib/resume-auth";
import BlurFade from "@/components/magicui/blur-fade";
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
    redirect(`/api/resume/unlock?key=${encodeURIComponent(key)}`);
  }

  if (!isAuthorized(await cookies())) {
    return <LockedView />;
  }
  return <ApplicationsClient />;
}

const BLUR_FADE_DELAY = 0.04;

function LockedView() {
  return (
    <main className="min-h-dvh flex flex-col gap-8">
      <BlurFade delay={BLUR_FADE_DELAY}>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" aria-hidden /> back home
        </Link>
      </BlurFade>

      <BlurFade delay={BLUR_FADE_DELAY * 2}>
        <div className="flex items-center gap-3">
          <Target className="size-7 text-muted-foreground" aria-hidden />
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Job Tracker
          </h1>
        </div>
      </BlurFade>

      <BlurFade delay={BLUR_FADE_DELAY * 3}>
        <div className="rounded-md border border-border bg-card/40 p-5 sm:p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            A personal tool. It pulls ATS keywords out of a job description
            and tracks which roles I&apos;ve applied to by scanning my inbox.
            It&apos;s gated, so the tool itself isn&apos;t shown here.
          </p>
        </div>
      </BlurFade>

      <BlurFade delay={BLUR_FADE_DELAY * 4}>
        <div className="rounded-md border border-border bg-card/40 p-5 sm:p-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            The interesting engineering piece is the JD-to-keywords extraction
            (an LLM call in JSON mode, then a punctuation-aware match against my
            resume text) and a Gmail Apps Script that classifies application
            emails and feeds a live spreadsheet. Happy to walk through it.
          </p>
          <div className="mt-4">
            <Link
              href="mailto:NateWhite.dev@gmail.com?subject=Job%20Tracker%20tool"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:underline"
            >
              <Mail className="size-4" aria-hidden />
              NateWhite.dev@gmail.com
            </Link>
          </div>
        </div>
      </BlurFade>
    </main>
  );
}
