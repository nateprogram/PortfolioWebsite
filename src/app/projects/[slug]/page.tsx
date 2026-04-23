/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Markdown from "react-markdown";
import BlurFade from "@/components/magicui/blur-fade";
import { Badge } from "@/components/ui/badge";
import { DATA, PROJECT_DETAILS } from "@/data/resume";
import { cn } from "@/lib/utils";
import {
  InterleavedProse,
  InlineCodeSnippet,
  type CodeSnippet,
} from "@/components/interleaved-prose";
import { LightboxFigure } from "@/components/lightbox-figure";
import { StockaiDataflow } from "@/components/dataflow";
import { GaRunChart } from "@/components/ga-run-chart";
import { highlightCode } from "@/lib/highlight";

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

// Dispatch table for figures that render a custom interactive component
// rather than a static image. Keeps the resume.tsx data side declarative.
type Figure =
  | { src: string; alt: string; caption?: string }
  | {
      diagram: "stockai-dataflow" | "ga-scatter";
      alt: string;
      caption?: string;
    };

function FigureRenderer({ figure }: { figure: Figure }) {
  if ("diagram" in figure) {
    const Diagram =
      figure.diagram === "stockai-dataflow"
        ? StockaiDataflow
        : figure.diagram === "ga-scatter"
        ? GaRunChart
        : null;
    if (!Diagram) return null;
    return (
      // NOTE: no `overflow-hidden` here. The GA chart's hover tooltip is
      // absolutely positioned on the wrapper, and with `overflow-hidden`
      // the tooltip gets clipped against the figure's rounded edge when a
      // point is near the border.
      //
      // We don't add `role="img"` on the inner wrapper anymore — each
      // diagram component provides its own landmark role (`img` for the
      // static SVG chart, `region` for the interactive dataflow). Adding
      // a generic `role="img"` here would swallow the buttons inside the
      // interactive dataflow for screen readers.
      <figure
        className={cn(
          "flex flex-col gap-2 rounded-xl border border-border bg-muted/20 p-3 sm:p-4",
          SILVER_CARD
        )}
      >
        <div className="w-full">
          <Diagram />
        </div>
        {figure.caption && (
          <figcaption className="px-1 pb-1 pt-1 text-xs text-pretty leading-relaxed text-muted-foreground">
            {figure.caption}
          </figcaption>
        )}
      </figure>
    );
  }
  return (
    <LightboxFigure
      src={figure.src}
      alt={figure.alt}
      caption={figure.caption}
    />
  );
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

  // Pre-run every snippet through shiki so the client gets ready-to-paint
  // VS Code Dark+ HTML and the shiki bundle never ships to the browser.
  const highlightedSnippets: ReadonlyArray<CodeSnippet> = await Promise.all(
    (details?.codeSnippets ?? []).map(async (s) => ({
      ...s,
      highlightedHtml: await highlightCode(s.code, s.language),
    }))
  );

  // Snippets that weren't referenced by a `{{code:id}}` placeholder in the
  // approach/problem prose fall back to a "More code" section at the bottom
  // so nothing gets silently dropped. Normally this is empty.
  const allSnippetIds = new Set(highlightedSnippets.map((s) => s.id));
  const referenced = new Set<string>();
  const placeholderRe = /\{\{code:([a-zA-Z0-9_-]+)\}\}/g;
  for (const body of [details?.problem, details?.approach]) {
    if (!body) continue;
    let m: RegExpExecArray | null;
    while ((m = placeholderRe.exec(body)) !== null) referenced.add(m[1]);
  }
  const orphanSnippets = highlightedSnippets.filter(
    (s) => allSnippetIds.has(s.id) && !referenced.has(s.id)
  );

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
            <InterleavedProse
              markdown={details.problem}
              snippets={highlightedSnippets}
            />
          </section>
        </BlurFade>
      )}

      {details?.approach && (
        <BlurFade delay={BLUR_FADE_DELAY * 10}>
          <section className="flex flex-col gap-3">
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Approach
            </h2>
            <InterleavedProse
              markdown={details.approach}
              snippets={highlightedSnippets}
            />
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
                <FigureRenderer key={i} figure={figure} />
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

      {/* Orphan snippets (not referenced inline). Normally empty — the
          inline `{{code:id}}` placeholders pull everything into the prose. */}
      {orphanSnippets.length > 0 && (
        <BlurFade delay={BLUR_FADE_DELAY * 13}>
          <section className="flex flex-col gap-3">
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              More code
            </h2>
            <div className="flex flex-col gap-2">
              {orphanSnippets.map((s) => (
                <InlineCodeSnippet key={s.id} snippet={s} />
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
