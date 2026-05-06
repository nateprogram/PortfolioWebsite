// Recruiter-facing view for /tools/resume when no valid session cookie
// is present. The Builder component is the locked-out content; this is
// the public-facing explanation of what the tool is and how it works.
//
// Server component, no JS, no API calls. Fast and indexable.

import Link from "next/link";
import { ArrowLeft, Wand2, Mail } from "lucide-react";
import BlurFade from "@/components/magicui/blur-fade";

const BLUR_FADE_DELAY = 0.04;

export function LockedView() {
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
          <Wand2 className="size-7 text-muted-foreground" aria-hidden />
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Resume Builder
          </h1>
        </div>
      </BlurFade>

      <BlurFade delay={BLUR_FADE_DELAY * 3}>
        <div className="rounded-md border border-border bg-card/40 p-5 sm:p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            This is a personal tool. It takes a job description, runs it
            through Gemini together with my full body of project work, and
            produces a tailored resume in my voice with the JD&apos;s ATS
            keywords woven in. The tool is gated to keep API costs
            predictable, so the form isn&apos;t shown here.
          </p>
        </div>
      </BlurFade>

      <BlurFade delay={BLUR_FADE_DELAY * 4}>
        <div className="flex flex-col gap-3">
          <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            How it works
          </div>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
            <li>
              <span className="text-foreground font-medium">Corpus.</span>{" "}
              Every project, role, and case-study deep-dive on this site,
              plus a private extended file (high-school robotics, home
              infrastructure, framing notes), is assembled into a single
              prompt context.
            </li>
            <li>
              <span className="text-foreground font-medium">
                System prompt.
              </span>{" "}
              Locks the model to my style: no em dashes, no AI-tell
              vocabulary, concrete metrics over adjectives. Anti-fabrication
              rules require every number, title, and date to trace back to
              the corpus verbatim.
            </li>
            <li>
              <span className="text-foreground font-medium">Generation.</span>{" "}
              Gemini Flash extracts 12 to 20 ATS keywords from the JD, picks
              the most relevant projects (often dropping ones that don&apos;t
              help), and rewrites the order and framing for the role. The
              response streams back to the page as Markdown.
            </li>
            <li>
              <span className="text-foreground font-medium">Persistence.</span>{" "}
              Each generation is saved to a small key-value store so I can
              browse history and re-export later. Anything older than the
              200 most recent gets trimmed to keep storage bounded.
            </li>
            <li>
              <span className="text-foreground font-medium">Export.</span>{" "}
              One-click download as a Word .docx, single-column ATS-friendly
              layout, Calibri body, no images, no tables for layout.
            </li>
          </ul>
        </div>
      </BlurFade>

      <BlurFade delay={BLUR_FADE_DELAY * 5}>
        <div className="flex flex-col gap-3">
          <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            Want to see it run on a real JD?
          </div>
          <div className="rounded-md border border-border bg-card/40 p-5 sm:p-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Send the JD by email and I&apos;ll run it and reply with the
              tailored resume + the extracted keyword list. Usually under
              an hour during business hours.
            </p>
            <div className="mt-4">
              <Link
                href="mailto:NateWhite.dev@gmail.com?subject=Resume%20Builder%20JD"
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:underline"
              >
                <Mail className="size-4" aria-hidden />
                NateWhite.dev@gmail.com
              </Link>
            </div>
          </div>
        </div>
      </BlurFade>
    </main>
  );
}
