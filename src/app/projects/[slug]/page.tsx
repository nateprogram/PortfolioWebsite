/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import Markdown from "react-markdown";
import BlurFade from "@/components/magicui/blur-fade";
import { Badge } from "@/components/ui/badge";
import { DATA, PROJECT_DETAILS } from "@/data/resume";
import { cn } from "@/lib/utils";

const BLUR_FADE_DELAY = 0.04;

// Silver edging: inset top highlight gives bordered surfaces a subtle metallic catch-the-light feel.
const SILVER_CARD =
  "ring-1 ring-inset ring-white/[0.04] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]";
const SILVER_CHIP =
  "ring-1 ring-inset ring-white/[0.05] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]";

export async function generateStaticParams() {
  return DATA.projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = DATA.projects.find((p) => p.slug === slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary,
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = DATA.projects.find((p) => p.slug === slug);
  if (!project) notFound();
  const details = PROJECT_DETAILS[slug];

  return (
    <main className="min-h-dvh flex flex-col gap-10 relative">
      <BlurFade delay={BLUR_FADE_DELAY}>
        <Link
          href="/#projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm w-fit"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          All projects
        </Link>
      </BlurFade>

      <header className="flex flex-col gap-4">
        <BlurFade delay={BLUR_FADE_DELAY * 2}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  project.status === "Active"
                    ? "bg-emerald-500"
                    : project.status === "Coursework"
                    ? "bg-sky-500"
                    : "bg-muted-foreground"
                )}
                aria-hidden
              />
              {project.status}
            </span>
            {project.categories && project.categories.length > 0 && (
              <>
                <span aria-hidden>·</span>
                <span>{project.categories.join(" / ")}</span>
              </>
            )}
          </div>
        </BlurFade>

        <BlurFade delay={BLUR_FADE_DELAY * 3}>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tighter">
            {project.title}
          </h1>
        </BlurFade>

        <BlurFade delay={BLUR_FADE_DELAY * 4}>
          <p className="text-muted-foreground md:text-lg text-balance">
            {project.summary}
          </p>
        </BlurFade>
      </header>

      {(project.video || project.image) && (
        <BlurFade delay={BLUR_FADE_DELAY * 5}>
          <div
            className={cn(
              "overflow-hidden rounded-xl border border-border bg-muted/30",
              SILVER_CARD
            )}
          >
            {project.video ? (
              <video
                src={project.video}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto object-cover"
              />
            ) : project.image ? (
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-auto object-cover"
              />
            ) : null}
          </div>
        </BlurFade>
      )}

      {project.links && project.links.length > 0 && (
        <BlurFade delay={BLUR_FADE_DELAY * 6}>
          <section className="flex flex-wrap gap-2">
            {project.links.map((link) => (
              <Link
                key={link.type}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs font-medium hover:border-foreground/30 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  SILVER_CHIP
                )}
              >
                {link.icon}
                {link.type}
              </Link>
            ))}
          </section>
        </BlurFade>
      )}

      {/* Highlights lead: scannable, quantifiable. */}
      {details?.highlights && details.highlights.length > 0 && (
        <BlurFade delay={BLUR_FADE_DELAY * 7}>
          <section className="flex flex-col gap-3">
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Highlights
            </h2>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              {details.highlights.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span
                    className="mt-2 size-1 shrink-0 rounded-full bg-gradient-to-b from-zinc-200 to-zinc-500 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
                    aria-hidden
                  />
                  <span className="text-pretty leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </BlurFade>
      )}

      {project.technologies && project.technologies.length > 0 && (
        <BlurFade delay={BLUR_FADE_DELAY * 8}>
          <section className="flex flex-col gap-3">
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Stack
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {project.technologies.map((tech) => (
                <Badge
                  key={tech}
                  variant="outline"
                  className={cn(
                    "text-[11px] font-medium border border-border h-6 px-2",
                    SILVER_CHIP
                  )}
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </section>
        </BlurFade>
      )}

      {details?.problem && (
        <BlurFade delay={BLUR_FADE_DELAY * 9}>
          <section className="flex flex-col gap-3">
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Problem
            </h2>
            <div className="prose max-w-none text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert">
              <Markdown>{details.problem}</Markdown>
            </div>
          </section>
        </BlurFade>
      )}

      {details?.approach && (
        <BlurFade delay={BLUR_FADE_DELAY * 10}>
          <section className="flex flex-col gap-3">
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Approach
            </h2>
            <div className="prose max-w-none text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert">
              <Markdown>{details.approach}</Markdown>
            </div>
          </section>
        </BlurFade>
      )}

      {/* Figures live right under Approach so diagrams read as part of the story. */}
      {details?.figures && details.figures.length > 0 && (
        <BlurFade delay={BLUR_FADE_DELAY * 11}>
          <section className="flex flex-col gap-3">
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Figures
            </h2>
            <div className="flex flex-col gap-6">
              {details.figures.map((figure, i) => (
                <figure
                  key={i}
                  className={cn(
                    "flex flex-col gap-2 overflow-hidden rounded-xl border border-border bg-muted/30",
                    SILVER_CARD
                  )}
                >
                  <img
                    src={figure.src}
                    alt={figure.alt}
                    className="w-full h-auto bg-background"
                  />
                  {figure.caption && (
                    <figcaption className="px-4 pb-3 text-xs text-pretty leading-relaxed text-muted-foreground">
                      {figure.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </section>
        </BlurFade>
      )}

      {details?.stackRationale && details.stackRationale.length > 0 && (
        <BlurFade delay={BLUR_FADE_DELAY * 12}>
          <section className="flex flex-col gap-3">
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Why these choices
            </h2>
            <dl className="flex flex-col gap-3">
              {details.stackRationale.map((entry) => (
                <div
                  key={entry.tech}
                  className="grid gap-1 sm:grid-cols-[180px_1fr] sm:gap-4"
                >
                  <dt className="font-mono text-[11px] uppercase tracking-widest text-foreground/80">
                    {entry.tech}
                  </dt>
                  <dd className="text-sm text-pretty leading-relaxed text-muted-foreground">
                    {entry.why}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </BlurFade>
      )}

      {/* Code snippets live behind expandables so the narrative stays clean
          but recruiters who want the actual shape of the code can click in. */}
      {details?.codeSnippets && details.codeSnippets.length > 0 && (
        <BlurFade delay={BLUR_FADE_DELAY * 13}>
          <section className="flex flex-col gap-3">
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Code
            </h2>
            <p className="text-xs text-muted-foreground">
              Expand a snippet to see the relevant code. Real shapes from the
              project, trimmed for readability.
            </p>
            <div className="flex flex-col gap-2">
              {details.codeSnippets.map((snippet, i) => (
                <details
                  key={i}
                  className={cn(
                    "group overflow-hidden rounded-xl border border-border bg-card/40",
                    SILVER_CARD
                  )}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm select-none hover:bg-card/70 transition-colors [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center gap-2 min-w-0">
                      <ChevronDown
                        className="size-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                        aria-hidden
                      />
                      <span className="font-medium truncate">
                        {snippet.title}
                      </span>
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">
                      {snippet.language}
                    </span>
                  </summary>
                  {snippet.description && (
                    <div className="border-t border-border/60 px-4 py-3 text-xs text-pretty leading-relaxed text-muted-foreground">
                      {snippet.description}
                    </div>
                  )}
                  <pre className="overflow-x-auto border-t border-border/60 bg-background/50 px-4 py-3 text-[12px] leading-relaxed">
                    <code className="font-mono text-foreground/90">
                      {snippet.code}
                    </code>
                  </pre>
                </details>
              ))}
            </div>
          </section>
        </BlurFade>
      )}

      {!details?.problem && project.description && (
        <BlurFade delay={BLUR_FADE_DELAY * 14}>
          <section className="flex flex-col gap-3">
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Overview
            </h2>
            <div className="prose max-w-none text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert">
              <Markdown>{project.description}</Markdown>
            </div>
          </section>
        </BlurFade>
      )}

      {!details && (
        <BlurFade delay={BLUR_FADE_DELAY * 15}>
          <section className="flex flex-col gap-3 border-t border-border pt-8">
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              More to come
            </h2>
            <p className="text-sm text-muted-foreground max-w-prose">
              A deeper write-up is in the works: problem framing, key decisions
              and rejected alternatives, architecture notes, and outcomes. In the
              meantime, reach out at{" "}
              <a
                href={`mailto:${DATA.contact.email}`}
                className="underline underline-offset-4 hover:text-foreground"
              >
                {DATA.contact.email}
              </a>{" "}
              for a walkthrough.
            </p>
          </section>
        </BlurFade>
      )}

    </main>
  );
}
