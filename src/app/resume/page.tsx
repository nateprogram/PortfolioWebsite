import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Download } from "lucide-react";
import BlurFade from "@/components/magicui/blur-fade";
import { PrintButton } from "@/components/print-button";
import { companyLabel, DATA, formatRange, RESUME } from "@/data";

// The resume as a web page. Same data as the downloadable PDF
// (src/app/resume.pdf/route.tsx), so the two can't drift. Server-rendered
// and readable without JS; prints to a clean one-page document via the
// print styles here and in globals.css.

export const metadata: Metadata = {
  title: "Resume",
  description: `${RESUME.name}: ${RESUME.headline}. Experience, projects, skills, and education.`,
  alternates: {
    canonical: "/resume",
    types: { "application/pdf": "/resume.pdf" },
  },
};

const BLUR_FADE_DELAY = 0.04;

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground print:text-[8.6pt] print:text-black print:tracking-widest">
      {children}
      <span className="h-px flex-1 bg-border print:bg-black/30" aria-hidden />
    </h2>
  );
}

function Bullets({ items }: { items: ReadonlyArray<string> }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-1.5 flex flex-col gap-1 print:mt-0.5 print:gap-0 text-sm leading-relaxed text-muted-foreground print:text-[9.3pt] print:leading-[1.24] print:text-black/85">
      {items.map((b) => (
        <li key={b} className="flex gap-2">
          <span className="mt-[0.6em] size-1 shrink-0 rounded-full bg-muted-foreground/60 print:bg-black/70" aria-hidden />
          <span className="text-pretty">{b}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ResumePage() {
  return (
    <main className="flex flex-col gap-6">
      {/* The resume reveals on load rather than on scroll-into-view: a
          client-side visit from a scrolled page lands with this toolbar at
          the very top edge, where the in-view check never fires, and the
          Print / Download buttons stayed invisible. */}
      <BlurFade delay={BLUR_FADE_DELAY} inView={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Home
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline font-mono text-[11px] text-muted-foreground">
              Updated {RESUME.updated}
            </span>
            <PrintButton />
            <a
              href="/resume.pdf"
              download="Nate-White-Resume.pdf"
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              <Download className="size-3.5" aria-hidden />
              Download PDF
            </a>
          </div>
        </div>
      </BlurFade>

      <BlurFade delay={BLUR_FADE_DELAY * 2} inView={false}>
        <article className="relative overflow-hidden rounded-2xl border border-border bg-card/70 p-6 shadow-[0_30px_80px_-40px_var(--brand-soft)] backdrop-blur sm:p-10 print:overflow-visible print:rounded-none print:border-0 print:bg-white print:p-0 print:text-black print:shadow-none">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent opacity-60 print:hidden"
            aria-hidden
          />

          <header className="flex flex-col gap-1.5 border-b border-border pb-5 print:border-black/30 print:gap-1 print:pb-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl print:text-[17pt] print:leading-none print:text-black">
              {RESUME.name}
            </h1>
            <p className="text-sm font-medium text-foreground/80 print:text-[9.8pt] print:text-black">
              {RESUME.headline}
            </p>
            <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground print:text-[8.6pt] print:text-black/80">
              <span>{RESUME.location}</span>
              <a href={`mailto:${RESUME.email}`} className="hover:text-foreground print:text-black">
                {RESUME.email}
              </a>
              {RESUME.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground print:text-black"
                >
                  {l.label}
                </a>
              ))}
            </p>
          </header>

          <div className="mt-6 flex flex-col gap-7 print:mt-2 print:gap-2.5">
            <section className="flex flex-col gap-2 print:gap-1">
              <SectionHeading>Summary</SectionHeading>
              <p className="text-sm leading-relaxed text-muted-foreground text-pretty print:text-[9.3pt] print:leading-[1.24] print:text-black/85">
                {RESUME.summary}
              </p>
            </section>

            <section className="flex flex-col gap-2 print:gap-1">
              <SectionHeading>Skills</SectionHeading>
              <dl className="grid gap-1.5 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4 print:gap-y-0.5 print:text-[9.3pt]">
                {RESUME.skills.map((s) => (
                  <div key={s.label} className="contents">
                    <dt className="font-medium text-foreground/90 print:text-black">{s.label}</dt>
                    <dd className="text-muted-foreground print:text-black/85">{s.items}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="flex flex-col gap-2 print:gap-1">
              <SectionHeading>Education</SectionHeading>
              {RESUME.education.map((ed) => (
                <div
                  key={ed.school}
                  className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                >
                  <div className="text-sm print:text-[9.3pt]">
                    <span className="font-semibold print:text-black">{ed.degree}</span>
                    <span className="text-muted-foreground print:text-black/80">
                      {" "}· {ed.school}, {ed.location}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground print:text-[8.6pt] print:text-black/80">
                    {ed.dates}
                  </span>
                </div>
              ))}
            </section>

            <section className="flex flex-col gap-4 print:gap-1.5">
              <SectionHeading>Experience</SectionHeading>
              {RESUME.experience.map((e) => (
                <div key={`${e.company}-${e.start}`} className="break-inside-avoid">
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <h3 className="text-[15px] font-semibold leading-snug print:text-[9.8pt] print:text-black">
                      {e.title}
                      <span className="font-normal text-muted-foreground print:text-black/80">
                        {" "}· {companyLabel(e)}
                      </span>
                      {/* On paper the meta line joins the title line, as in
                          the PDF, so the page holds everything. */}
                      <span className="hidden print:inline print:text-[8.6pt] print:font-normal print:text-black/70">
                        {" "}· {[e.location, ...(e.tags ?? [])].join(" · ")}
                      </span>
                    </h3>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground print:text-[8.6pt] print:text-black/80">
                      {formatRange(e)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground print:hidden">
                    {e.location}
                    {e.tags && e.tags.length > 0 && <> · {e.tags.join(" · ")}</>}
                  </div>
                  <Bullets items={e.bullets} />
                  {e.projectSlug && (
                    <Link
                      href={`/projects/${e.projectSlug}`}
                      className="group mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-brand transition-colors print:hidden"
                    >
                      Case study
                      <ArrowUpRight className="size-3 transition-transform group-hover:-translate-y-px group-hover:translate-x-px" aria-hidden />
                    </Link>
                  )}
                </div>
              ))}
            </section>

            <section className="flex flex-col gap-4 print:gap-1.5">
              <SectionHeading>Projects</SectionHeading>
              {RESUME.projects.map((p) => (
                <div key={p.name} className="break-inside-avoid">
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <h3 className="text-[15px] font-semibold leading-snug print:text-[9.8pt] print:text-black">
                      {p.slug ? (
                        <Link
                          href={`/projects/${p.slug}`}
                          className="underline decoration-border underline-offset-4 hover:decoration-brand print:no-underline"
                        >
                          {p.name}
                        </Link>
                      ) : (
                        p.name
                      )}
                      <span className="font-normal text-muted-foreground print:text-black/80">
                        {" "}· {p.tagline}
                      </span>
                      <span className="hidden print:inline print:text-[8.6pt] print:font-normal print:text-black/70">
                        {" "}· {p.stack}
                      </span>
                    </h3>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground print:text-[8.6pt] print:text-black/80">
                      {p.dates}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground print:hidden">
                    {p.stack}
                  </div>
                  <Bullets items={p.bullets} />
                </div>
              ))}
            </section>

          </div>
        </article>
      </BlurFade>

      <p className="text-center text-xs text-muted-foreground print:hidden">
        Want the full story? Every project above has a write-up on{" "}
        <Link href="/#projects" className="underline underline-offset-4 hover:text-foreground">
          {DATA.url.replace("https://", "")}
        </Link>
        .
      </p>
    </main>
  );
}
